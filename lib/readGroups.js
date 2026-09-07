'use strict';

/**
 * Grouped Modbus register reads.
 *
 * buildReadGroups() merges consecutive register definitions into as few
 * Modbus requests as possible. readRegisterGroups() executes those requests
 * and, when the device rejects a whole group with a Modbus exception
 * (ILLEGAL FUNCTION / ILLEGAL DATA ADDRESS), falls back to reading the
 * registers of that group one by one. Registers the device rejects
 * individually are remembered and excluded from later polls, so a single
 * unsupported register (e.g. one introduced in a newer protocol version or
 * one that does not apply to the installed hardware) no longer prevents the
 * other registers of its group from being read.
 */

/**
 * @typedef {object} ReadLog
 * @property {(msg: string) => void} debug - debug logger
 * @property {(msg: string) => void} info - info logger
 * @property {(msg: string) => void} warn - warn logger
 */

/**
 * @typedef {object} ModbusError
 * @property {string} message - error message
 * @property {number} [modbusCode] - Modbus exception code, set by modbus-serial on exception responses
 */

/**
 * Build optimized sequential read groups
 *
 * @param {object[]} registers - Register definitions ({ addr, qty, ... })
 * @param {number} maxQty - Maximum registers per group
 * @returns {object[]} Grouped register batches ({ startAddr, totalQty, registers })
 */
function buildReadGroups(registers, maxQty) {
    if (!registers || registers.length === 0) {
        return [];
    }

    const sorted = [...registers].sort((a, b) => a.addr - b.addr);
    const groups = [];
    let currentGroup = null;

    for (const reg of sorted) {
        if (!currentGroup) {
            currentGroup = {
                startAddr: reg.addr,
                totalQty: reg.qty,
                registers: [{ ...reg, offset: 0 }],
            };
        } else {
            const expectedNext = currentGroup.startAddr + currentGroup.totalQty;
            const gap = reg.addr - expectedNext;

            if (gap >= 0 && gap <= 4 && currentGroup.totalQty + gap + reg.qty <= maxQty) {
                const offset = reg.addr - currentGroup.startAddr;
                currentGroup.totalQty = Math.max(currentGroup.totalQty, offset + reg.qty);
                currentGroup.registers.push({ ...reg, offset });
            } else {
                groups.push(currentGroup);
                currentGroup = {
                    startAddr: reg.addr,
                    totalQty: reg.qty,
                    registers: [{ ...reg, offset: 0 }],
                };
            }
        }
    }
    if (currentGroup) {
        groups.push(currentGroup);
    }
    return groups;
}

/**
 * Whether an error is a Modbus exception proving that the device does not
 * implement the requested register(s). modbus-serial sets `modbusCode` on
 * exception responses: 1 = ILLEGAL FUNCTION, 2 = ILLEGAL DATA ADDRESS.
 * Other exception codes and transport errors (timeouts, socket errors)
 * prove nothing about the register and must not exclude it.
 *
 * @param {ModbusError | null | undefined} err - Error thrown by the Modbus client
 * @returns {boolean} true if the device rejected the register(s)
 */
function isRegisterRejected(err) {
    return !!err && (err.modbusCode === 1 || err.modbusCode === 2);
}

/**
 * Remember a register the device rejected and log it once.
 *
 * @param {string} section - Section name for the log message
 * @param {object} reg - Register definition
 * @param {Set<number>} unsupported - Set of rejected register addresses
 * @param {ModbusError} err - The Modbus exception
 * @param {ReadLog} log - Logger
 */
function markUnsupported(section, reg, unsupported, err, log) {
    unsupported.add(reg.addr);
    log.info(
        `[${section}] register ${reg.addr} (${reg.name}) is not supported by this device ` +
            `(${err.message}) - excluded from further polling`,
    );
}

/**
 * Read the registers of a rejected group one by one.
 *
 * @param {object} opts - Options, see readRegisterGroups()
 * @param {string} opts.section - Section name
 * @param {object} opts.group - The rejected group
 * @param {Set<number>} opts.unsupported - Set of rejected register addresses
 * @param {(addr: number, qty: number) => Promise<number[]>} opts.read - Register read function
 * @param {(group: object, raw: number[]) => Promise<void>} opts.process - Group processing function
 * @param {(ms: number) => Promise<void>} opts.sleep - Pause function
 * @param {() => boolean} opts.isStopped - Shutdown check
 * @param {ReadLog} opts.log - Logger
 * @returns {Promise<void>} resolves when all registers were tried
 */
async function readGroupIndividually(opts) {
    const { section, group, unsupported, read, process, sleep, isStopped, log } = opts;
    for (const reg of group.registers) {
        if (isStopped()) {
            return;
        }
        try {
            const raw = await read(reg.addr, reg.qty);
            await process({ startAddr: reg.addr, totalQty: reg.qty, registers: [{ ...reg, offset: 0 }] }, raw);
        } catch (err) {
            if (isRegisterRejected(err)) {
                markUnsupported(section, reg, unsupported, err, log);
            } else {
                log.debug(`[${section}] read error at ${reg.addr} (${reg.name}): ${err.message}`);
            }
        }
        await sleep(50);
    }
}

/**
 * Read a register set in grouped requests with per-register fallback.
 *
 * @param {object} opts - Options
 * @param {string} opts.section - Section name used in log messages (e.g. 'dcCharger')
 * @param {object[]} opts.registers - Register definitions to read
 * @param {number} opts.batchSize - Maximum registers per Modbus request
 * @param {Set<number>} opts.unsupported - Addresses rejected by the device; extended by this call and excluded from grouping
 * @param {Set<number>} opts.errorLogged - Group start addresses whose transport error was already logged at warn level
 * @param {(addr: number, qty: number) => Promise<number[]>} opts.read - Reads `qty` registers starting at `addr`
 * @param {(group: object, raw: number[]) => Promise<void>} opts.process - Processes the raw data of one group
 * @param {(ms: number) => Promise<void>} opts.sleep - Pause between requests
 * @param {() => boolean} opts.isStopped - Returns true while the adapter is shutting down
 * @param {ReadLog} opts.log - Logger
 * @returns {Promise<void>} resolves when all groups were processed
 */
async function readRegisterGroups(opts) {
    const { section, batchSize, unsupported, errorLogged, read, process, sleep, isStopped, log } = opts;
    const registers = opts.registers.filter(r => !unsupported.has(r.addr));
    const groups = buildReadGroups(registers, batchSize);
    log.debug(`[${section}] reading ${registers.length} register(s) in ${groups.length} group(s)`);

    for (const group of groups) {
        if (isStopped()) {
            return;
        }
        try {
            const raw = await read(group.startAddr, group.totalQty);
            await process(group, raw);
            await sleep(100);
        } catch (err) {
            if (!isRegisterRejected(err)) {
                // Transport error, timeout or a non-conclusive exception: keep the
                // group, warn once and simply retry on the next poll cycle.
                if (!errorLogged.has(group.startAddr)) {
                    errorLogged.add(group.startAddr);
                    log.warn(
                        `[${section}] register read error at ${group.startAddr} (qty ${group.totalQty}): ${err.message}`,
                    );
                } else {
                    log.debug(`[${section}] read error at ${group.startAddr}: ${err.message}`);
                }
                continue;
            }
            if (group.registers.length === 1) {
                markUnsupported(section, group.registers[0], unsupported, err, log);
                continue;
            }
            log.debug(
                `[${section}] group ${group.startAddr} (qty ${group.totalQty}) rejected by device ` +
                    `(${err.message}) - reading its registers individually`,
            );
            await readGroupIndividually({ section, group, unsupported, read, process, sleep, isStopped, log });
        }
    }
}

/**
 * Split registers into those supported by the detected protocol version and
 * those introduced in a newer version (`reg.since`). With an unknown version
 * (0 / undefined) nothing is skipped.
 *
 * @param {object[]} registers - Register definitions, optionally with `since`
 * @param {number} protocolVersion - Detected protocol version (e.g. 2.8), 0 = unknown
 * @returns {{ active: object[], skipped: object[] }} partitioned registers
 */
function filterByProtocolVersion(registers, protocolVersion) {
    if (!protocolVersion || protocolVersion <= 0) {
        return { active: registers, skipped: [] };
    }
    const skipped = registers.filter(r => typeof r.since === 'number' && r.since > protocolVersion);
    const active = skipped.length > 0 ? registers.filter(r => !skipped.includes(r)) : registers;
    return { active, skipped };
}

module.exports = { buildReadGroups, readRegisterGroups, isRegisterRejected, filterByProtocolVersion };
