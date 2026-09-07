'use strict';

const path = require('node:path');
const { tests } = require('@iobroker/testing');

const assert = require('node:assert');
const { buildReadGroups, readRegisterGroups, isRegisterRejected, filterByProtocolVersion } = require('../lib/readGroups');
const {
    DC_CHARGER_READ_REGISTERS,
    PLANT_READ_REGISTERS,
    PLANT_WRITE_REGISTERS,
    ESS_PREHEATING_WRITE_REGISTERS,
    INVERTER_READ_REGISTERS,
    DC_CHARGER_WRITE_REGISTERS,
    AC_CHARGER_READ_REGISTERS,
    PSS_READ_REGISTERS,
    PID_READ_REGISTERS,
    applySince,
} = require('../lib/registers');
const ModbusConnection = require('../lib/modbus');

/**
 * Create a Modbus exception like modbus-serial does (err.modbusCode set).
 *
 * @param {number} code - Modbus exception code
 * @returns {Error & { modbusCode: number }} error object
 */
function modbusException(code) {
    const err = /** @type {Error & { modbusCode: number }} */ (new Error(`Modbus exception ${code}: Illegal data address`));
    err.modbusCode = code;
    return err;
}

/**
 * Build the option object for readRegisterGroups() with a fake device.
 *
 * @param {object[]} registers - Register definitions
 * @param {number} batchSize - Maximum registers per request
 * @param {(addr: number, qty: number) => number[]} device - Fake device: returns raw data or throws
 * @returns {object} options plus the recorded calls
 */
function makeOpts(registers, batchSize, device) {
    const calls = { reads: [], processed: [], log: { debug: [], info: [], warn: [] } };
    const opts = {
        section: 'test',
        registers,
        batchSize,
        unsupported: new Set(),
        errorLogged: new Set(),
        read: async (addr, qty) => {
            calls.reads.push([addr, qty]);
            return device(addr, qty);
        },
        process: async group => {
            for (const reg of group.registers) {
                calls.processed.push(reg.name);
            }
        },
        sleep: async () => {},
        isStopped: () => false,
        log: {
            debug: m => calls.log.debug.push(m),
            info: m => calls.log.info.push(m),
            warn: m => calls.log.warn.push(m),
        },
    };
    return { opts, calls };
}

// Run unit tests — tests the adapter startup in a mocked environment
tests.unit(path.join(__dirname, '..'), {
    defineAdditionalTests() {
        describe('lib/readGroups', () => {
            it('groups the DC charger registers into three FC04 requests of at most 10 registers', () => {
                const groups = buildReadGroups(DC_CHARGER_READ_REGISTERS, 10);
                assert.deepStrictEqual(
                    groups.map(g => [g.startAddr, g.totalQty]),
                    [
                        [31500, 9],
                        [31509, 10],
                        [31519, 8],
                    ],
                );
                const second = groups[1].registers.map(r => r.name);
                assert.ok(second.includes('dcCharger.runningState'));
                assert.ok(second.includes('dcCharger.dischargingCurrent'));
            });

            it('treats only Modbus exceptions 1 and 2 as "register not implemented"', () => {
                assert.strictEqual(isRegisterRejected(modbusException(1)), true);
                assert.strictEqual(isRegisterRejected(modbusException(2)), true);
                assert.strictEqual(isRegisterRejected(modbusException(3)), false);
                assert.strictEqual(isRegisterRejected(new Error('Timed out')), false);
                assert.strictEqual(isRegisterRejected(undefined), false);
            });

            it('reads a rejected group register by register and excludes only the rejected register', async () => {
                // Device: rejects any request that touches 31514-31518 (discharging registers)
                const rejects = (addr, qty) => addr + qty - 1 >= 31514 && addr <= 31518;
                const device = (addr, qty) => {
                    if (rejects(addr, qty)) {
                        throw modbusException(2);
                    }
                    return new Array(qty).fill(1);
                };
                const { opts, calls } = makeOpts(DC_CHARGER_READ_REGISTERS, 10, device);

                await readRegisterGroups(opts);

                // runningState (31513) got its value although its group 31509-31518 was rejected
                assert.ok(calls.processed.includes('dcCharger.runningState'));
                assert.ok(calls.processed.includes('dcCharger.pvDailyGeneration'));
                assert.ok(!calls.processed.includes('dcCharger.dischargingCurrent'));
                // exactly the rejected registers are remembered
                assert.deepStrictEqual([...opts.unsupported].sort(), [31514, 31515, 31517]);
                assert.strictEqual(calls.log.info.length, 3);
                assert.strictEqual(calls.log.warn.length, 0);

                // second poll: rejected registers are no longer requested, runningState is read in a group
                calls.reads.length = 0;
                calls.processed.length = 0;
                await readRegisterGroups(opts);
                assert.ok(calls.reads.every(([addr, qty]) => !rejects(addr, qty)));
                assert.ok(calls.processed.includes('dcCharger.runningState'));
                assert.strictEqual(calls.reads.length, 3);
            });

            it('keeps a group on transport errors and warns only once', async () => {
                let fail = true;
                const device = (addr, qty) => {
                    if (fail && addr === 31509) {
                        throw new Error('Timed out');
                    }
                    return new Array(qty).fill(0);
                };
                const { opts, calls } = makeOpts(DC_CHARGER_READ_REGISTERS, 10, device);

                await readRegisterGroups(opts);
                await readRegisterGroups(opts);
                assert.strictEqual(opts.unsupported.size, 0);
                assert.strictEqual(calls.log.warn.length, 1);

                fail = false;
                calls.processed.length = 0;
                await readRegisterGroups(opts);
                assert.ok(calls.processed.includes('dcCharger.runningState'));
            });

            it('skips DC charger registers newer than the detected protocol version', () => {
                const v28 = filterByProtocolVersion(DC_CHARGER_READ_REGISTERS, 2.8);
                assert.ok(v28.active.some(r => r.name === 'dcCharger.runningState'));
                assert.ok(!v28.active.some(r => r.name === 'dcCharger.dischargingCurrent'));
                assert.strictEqual(v28.skipped.length, 7);
                // with V2.8 the second group ends at runningState and no longer contains V2.9 registers
                assert.deepStrictEqual(
                    buildReadGroups(v28.active, 10).map(g => [g.startAddr, g.totalQty]),
                    [
                        [31500, 9],
                        [31509, 5],
                    ],
                );

                const v27 = filterByProtocolVersion(DC_CHARGER_READ_REGISTERS, 2.7);
                assert.ok(!v27.active.some(r => r.name === 'dcCharger.runningState'));
                assert.ok(v27.active.some(r => r.name === 'dcCharger.pvDailyGeneration'));

                // unknown protocol version: nothing is skipped
                const unknown = filterByProtocolVersion(DC_CHARGER_READ_REGISTERS, 0);
                assert.strictEqual(unknown.skipped.length, 0);
                assert.strictEqual(unknown.active.length, DC_CHARGER_READ_REGISTERS.length);
            });

            it('annotates registers with the protocol version from the revision history', () => {
                const since = (regs, addr) => (regs.find(r => r.addr === addr) || {}).since;
                // plant
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30000), undefined);
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30088), 2.6);
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30194), 2.7);
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30268), 2.7);
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30272), 2.9);
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30276), 2.8);
                assert.strictEqual(since(PLANT_READ_REGISTERS, 30286), 2.9);
                assert.strictEqual(since(PLANT_WRITE_REGISTERS, 40046), 2.6);
                assert.strictEqual(since(PLANT_WRITE_REGISTERS, 40049), 2.8);
                assert.strictEqual(since(PLANT_WRITE_REGISTERS, 40157), 2.9);
                assert.ok(ESS_PREHEATING_WRITE_REGISTERS.every(r => r.since === 2.9));
                // inverter / DC charger
                assert.strictEqual(since(INVERTER_READ_REGISTERS, 30601), undefined);
                assert.strictEqual(since(INVERTER_READ_REGISTERS, 30613), 2.6);
                assert.strictEqual(since(DC_CHARGER_READ_REGISTERS, 31509), 2.6);
                assert.strictEqual(since(DC_CHARGER_READ_REGISTERS, 31513), 2.8);
                assert.strictEqual(since(DC_CHARGER_READ_REGISTERS, 31514), 2.9);
                assert.strictEqual(since(DC_CHARGER_WRITE_REGISTERS, 41000), undefined);
                assert.strictEqual(since(DC_CHARGER_WRITE_REGISTERS, 41002), 2.9);
                // whole device families / untouched families
                assert.ok(PSS_READ_REGISTERS.every(r => r.since === 2.9));
                assert.ok(PID_READ_REGISTERS.every(r => r.since === 2.9));
                assert.ok(AC_CHARGER_READ_REGISTERS.every(r => r.since === undefined));
                // explicit since wins over the table
                const regs = [{ addr: 5, qty: 1, since: 2.6 }, { addr: 6, qty: 1 }];
                applySince(regs, [{ from: 0, to: 10, since: 2.9 }]);
                assert.deepStrictEqual(regs.map(r => r.since), [2.6, 2.9]);
            });

            it('skips plant registers newer than the detected protocol version', () => {
                const v26 = filterByProtocolVersion(PLANT_READ_REGISTERS, 2.6);
                assert.ok(v26.active.some(r => r.addr === 30088));
                assert.ok(!v26.active.some(r => r.addr === 30194));
                assert.ok(!v26.active.some(r => r.addr === 30276));
                const v28 = filterByProtocolVersion(PLANT_READ_REGISTERS, 2.8);
                assert.ok(v28.active.some(r => r.addr === 30276));
                assert.ok(!v28.active.some(r => r.addr === 30286));
                assert.strictEqual(filterByProtocolVersion(PSS_READ_REGISTERS, 2.8).active.length, 0);
                assert.strictEqual(filterByProtocolVersion(PSS_READ_REGISTERS, 2.9).skipped.length, 0);
            });

            it('excludes a single-register group directly when the device rejects it', async () => {
                const regs = [
                    { addr: 100, qty: 1, name: 'a' },
                    { addr: 200, qty: 2, name: 'b' },
                ];
                const device = (addr, qty) => {
                    if (addr === 200) {
                        throw modbusException(2);
                    }
                    return new Array(qty).fill(0);
                };
                const { opts, calls } = makeOpts(regs, 10, device);
                await readRegisterGroups(opts);
                assert.deepStrictEqual(calls.processed, ['a']);
                assert.deepStrictEqual([...opts.unsupported], [200]);
            });
        });

        describe('lib/modbus parseValue — "register not valid" sentinels', () => {
            const parse = (raw, type, gain) => ModbusConnection.parseValue(raw, type, gain);

            it('returns null for an unsigned register the device marked as not valid', () => {
                // 0xFFFF / 0xFFFFFFFF: documented in the V2.9 protocol as
                // "register is not valid" and used by devices for registers
                // they do not implement, e.g. 31513 without a DC charger.
                assert.strictEqual(parse([0xffff], 'U16', null), null);
                assert.strictEqual(parse([0xffff], 'U16', 10), null);
                assert.strictEqual(parse([0xffff, 0xffff], 'U32', 100), null);
                assert.strictEqual(parse([0xffff, 0xffff, 0xffff, 0xffff], 'U64', 100), null);
            });

            it('does not scale the sentinel into a plausible looking measurement', () => {
                // Before the fix these produced 6553.5 A, 4294967.295 kW and
                // 42949672.95 kWh in the DC charger states.
                assert.notStrictEqual(parse([0xffff], 'U16', 10), 6553.5);
                assert.notStrictEqual(parse([0xffff, 0xffff], 'U32', 1000), 4294967.295);
                assert.notStrictEqual(parse([0xffff, 0xffff], 'U32', 100), 42949672.95);
            });

            it('keeps the largest still valid value of each unsigned type', () => {
                assert.strictEqual(parse([0xfffe], 'U16', 10), 6553.4);
                assert.strictEqual(parse([0xffff, 0xfffe], 'U32', 100), 42949672.94);
            });

            it('leaves signed types untouched, since the protocol defines no sentinel for them', () => {
                assert.strictEqual(parse([0x7fff], 'S16', 10), 3276.7);
                assert.strictEqual(parse([0x8000], 'S16', 10), -3276.8);
                assert.strictEqual(parse([0x7fff, 0xffff], 'S32', 1000), 2147483.647);
            });

            it('leaves ordinary values alone', () => {
                assert.strictEqual(parse([230], 'U16', null), 230);
                assert.strictEqual(parse([0], 'U16', 10), 0);
                assert.strictEqual(parse([2300], 'U16', 10), 230);
            });
        });
    },
});
