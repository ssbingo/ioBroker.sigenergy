'use strict';

const ModbusConnection = require('./modbus');
const {
    SIGENMICRO_IDENT_ADDR,
    SIGENMICRO_IDENT_QTY,
    SIGENMICRO_SERIAL_ADDR,
    SIGENMICRO_SERIAL_QTY,
} = require('./sigenMicroRegisters');

/**
 * SigenMicroScanner
 *
 * Scans a configurable Modbus slave-ID range for SigenMicro micro-inverters.
 *
 * Key: uses a SHORT probe timeout (1000 ms) so unresponsive IDs are skipped
 * quickly. The regular adapter timeout (often 5000 ms) is intentionally NOT
 * used here — a scan probe that waits 5 s per ID makes a 20-ID range take
 * over 100 s and the progress bar appears frozen.
 */

/** Timeout used per Modbus probe during scan (ms). Short on purpose. */
const SCAN_PROBE_TIMEOUT_MS = 1000;

/** Pause between individual ID probes (ms). Avoids bus saturation. */
const SCAN_INTER_PROBE_MS = 80;

class SigenMicroScanner {
    /**
     * @param {object} config  - Adapter native config
     * @param {object} log     - Logger {debug, info, warn, error}
     */
    constructor(config, log) {
        this.config = config;
        this.log    = log || console;
    }

    /**
     * Scan slave IDs [from … to] for SigenMicro devices.
     *
     * @param {number}   from  - First slave ID to probe (1–246)
     * @param {number}   to    - Last slave ID to probe (1–246)
     * @returns {Promise<Array<{slaveId:number, model:string, serial:string, active:boolean}>>}
     */
    async scan(from, to) {
        // IDs already occupied by other Sigenergy components — always skip
        const skipIds = new Set([
            this.config.plantId    || 247,
            this.config.inverterId || 1,
        ]);
        if (this.config.hasAcCharger) skipIds.add(this.config.acChargerId || 2);
        if (this.config.hasDcCharger) skipIds.add(this.config.dcChargerId || 3);

        const found = [];

        // Use a clone of the config with a short probe timeout
        const scanConfig = Object.assign({}, this.config, { timeout: SCAN_PROBE_TIMEOUT_MS });
        const modbus = new ModbusConnection(scanConfig, this.log);

        const connected = await modbus.connect();
        if (!connected) {
            throw new Error('SigenMicro scan: cannot connect to Modbus — check connection settings');
        }

        this.log.info(
            `[SigenMicroScanner] Scan IDs ${from}–${to} ` +
            `(skipping: ${[...skipIds].join(', ')}, probe timeout: ${SCAN_PROBE_TIMEOUT_MS} ms)`
        );

        try {
            for (let id = from; id <= to; id++) {
                if (skipIds.has(id)) {
                    this.log.debug(`[SigenMicroScanner] Skip ID ${id} (reserved)`);
                    continue;
                }

                try {
                    const modelRaw = await modbus.readHoldingRegisters(
                        id, SIGENMICRO_IDENT_ADDR, SIGENMICRO_IDENT_QTY
                    );
                    const model = ModbusConnection.parseValue(modelRaw, 'STRING', null) || '';

                    let serial = '';
                    try {
                        const serialRaw = await modbus.readHoldingRegisters(
                            id, SIGENMICRO_SERIAL_ADDR, SIGENMICRO_SERIAL_QTY
                        );
                        serial = ModbusConnection.parseValue(serialRaw, 'STRING', null) || '';
                    } catch (_) { /* serial optional */ }

                    const displayModel = model.trim() || `SigenMicro-${id}`;
                    this.log.info(
                        `[SigenMicroScanner] ID ${id}: model="${displayModel}", serial="${serial.trim()}"`
                    );
                    found.push({
                        slaveId: id,
                        model:   displayModel,
                        serial:  serial.trim(),
                        active:  false,
                    });
                } catch (_) {
                    this.log.debug(`[SigenMicroScanner] No response at ID ${id}`);
                }

                await new Promise(r => setTimeout(r, SCAN_INTER_PROBE_MS));
            }
        } finally {
            try { await modbus.disconnect(); } catch (_) {}
        }

        this.log.info(`[SigenMicroScanner] Done: ${found.length} device(s) found`);
        return found;
    }
}

module.exports = SigenMicroScanner;
