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
 * Uses the existing ModbusConnection (modbus-serial) — no extra npm package needed.
 *
 * Identification strategy:
 *   1. Try readHoldingRegisters(slaveId, 30500, 15) — model type string.
 *   2. Device responds  → read serial number string (30515).
 *   3. Return a device descriptor {slaveId, model, serial, active:false}.
 *   4. IDs that are already used by plant / inverter / chargers are skipped.
 *   5. IDs that time out or return an exception are silently skipped.
 */
class SigenMicroScanner {
    /**
     * @param {object}   config  - Adapter native config
     * @param {object}   log     - Logger {debug, info, warn, error}
     */
    constructor(config, log) {
        this.config = config;
        this.log    = log || console;
    }

    /**
     * Scan slave IDs [from … to] for SigenMicro devices.
     *
     * @param {number}   from        - First slave ID to probe (1–246)
     * @param {number}   to          - Last slave ID to probe (1–246)
     * @param {Function} [progressCb] - Called with (percent:number, currentId:number)
     * @returns {Promise<Array<{slaveId:number, model:string, serial:string, active:boolean}>>}
     */
    async scan(from, to, progressCb) {
        // IDs already occupied by other Sigenergy devices — skip them
        const skipIds = new Set([
            this.config.plantId    || 247,
            this.config.inverterId || 1,
        ]);
        if (this.config.hasAcCharger) skipIds.add(this.config.acChargerId || 2);
        if (this.config.hasDcCharger) skipIds.add(this.config.dcChargerId || 3);

        const total = to - from + 1;
        let   done  = 0;
        const found = [];

        // Dedicated Modbus connection for scan (avoids interference with polling)
        const modbus = new ModbusConnection(this.config, this.log);
        const connected = await modbus.connect();
        if (!connected) {
            throw new Error('SigenMicro scan: cannot connect to Modbus — check connection settings');
        }

        this.log.info(`[SigenMicroScanner] Starting scan: IDs ${from}–${to} (skipping: ${[...skipIds].join(', ')})`);

        try {
            for (let id = from; id <= to; id++) {
                done++;
                if (progressCb) progressCb(Math.round((done / total) * 100), id);

                if (skipIds.has(id)) {
                    this.log.debug(`[SigenMicroScanner] Skipping ID ${id} (reserved)`);
                    continue;
                }

                try {
                    // FC03 — read holding registers: model type string
                    const modelRaw = await modbus.readHoldingRegisters(id, SIGENMICRO_IDENT_ADDR, SIGENMICRO_IDENT_QTY);
                    const model    = ModbusConnection.parseValue(modelRaw, 'STRING', null) || '';

                    // Read serial number (optional — don't abort if it fails)
                    let serial = '';
                    try {
                        const serialRaw = await modbus.readHoldingRegisters(id, SIGENMICRO_SERIAL_ADDR, SIGENMICRO_SERIAL_QTY);
                        serial = ModbusConnection.parseValue(serialRaw, 'STRING', null) || '';
                    } catch (_) { /* serial read is optional */ }

                    const displayModel = model.trim() || `SigenMicro-${id}`;
                    this.log.info(`[SigenMicroScanner] Found device at ID ${id}: model="${displayModel}", serial="${serial}"`);

                    found.push({
                        slaveId: id,
                        model:   displayModel,
                        serial:  serial.trim(),
                        active:  false, // user must explicitly activate
                    });
                } catch (_) {
                    // No response or Modbus exception → no device at this ID
                    this.log.debug(`[SigenMicroScanner] No response at ID ${id}`);
                }

                // Brief pause between probes to avoid bus saturation
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        } finally {
            try { await modbus.disconnect(); } catch (_) { /* ignore */ }
        }

        this.log.info(`[SigenMicroScanner] Scan complete: ${found.length} device(s) found`);
        return found;
    }
}

module.exports = SigenMicroScanner;
