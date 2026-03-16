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
 * Scans a Modbus slave-ID range for SigenMicro micro-inverters.
 *
 * ROOT CAUSE FIX: The scanner now REUSES the adapter's existing ModbusConnection
 * instead of opening a second TCP connection. Most Sigenergy devices accept only
 * one simultaneous Modbus TCP connection; a second connect() attempt is refused,
 * causing every probe to fail silently and the progress bar to never move.
 *
 * The caller (main.js) must:
 *   1. Pause the polling interval before calling scan()
 *   2. Pass the existing connected ModbusConnection object
 *   3. Resume polling after scan() resolves
 */
class SigenMicroScanner {
    /**
     * @param {object} config  - Adapter native config (for reserved-ID list)
     * @param {object} log     - Logger {debug, info, warn, error}
     */
    constructor(config, log) {
        this.config = config;
        this.log    = log || console;
    }

    /**
     * Scan slave IDs [from…to] using an EXISTING Modbus connection.
     *
     * @param {number}          from    - First slave ID (1–246)
     * @param {number}          to      - Last slave ID (1–246)
     * @param {ModbusConnection} modbus  - Already-connected ModbusConnection to reuse
     * @returns {Promise<Array<{slaveId:number, model:string, serial:string, active:boolean}>>}
     */
    async scan(from, to, modbus) {
        // IDs already occupied by other Sigenergy components
        const skipIds = new Set([
            this.config.plantId    || 247,
            this.config.inverterId || 1,
        ]);
        if (this.config.hasAcCharger) skipIds.add(this.config.acChargerId || 2);
        if (this.config.hasDcCharger) skipIds.add(this.config.dcChargerId || 3);

        const found = [];

        // If no connection provided, create a temporary one (fallback)
        let ownConnection = false;
        if (!modbus || !modbus.connected) {
            this.log.warn('[SigenMicroScanner] No active connection passed — creating temporary connection');
            const scanConfig = Object.assign({}, this.config, { timeout: 1500 });
            modbus = new ModbusConnection(scanConfig, this.log);
            const ok = await modbus.connect();
            if (!ok) {
                throw new Error('SigenMicro scan: cannot connect to Modbus — check connection settings');
            }
            ownConnection = true;
        }

        this.log.info(
            `[SigenMicroScanner] Scan IDs ${from}–${to} ` +
            `(reusing existing connection, skipping: ${[...skipIds].join(', ')})`
        );

        try {
            for (let id = from; id <= to; id++) {
                if (skipIds.has(id)) {
                    this.log.debug(`[SigenMicroScanner] Skip ID ${id} (reserved)`);
                    continue;
                }

                try {
                    // Short per-request timeout so unresponsive IDs are skipped quickly
                    modbus.client.setTimeout(1000);

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
                    this.log.info(`[SigenMicroScanner] ID ${id}: model="${displayModel}" serial="${serial.trim()}"`);
                    found.push({ slaveId: id, model: displayModel, serial: serial.trim(), active: false });

                } catch (_) {
                    this.log.debug(`[SigenMicroScanner] No response at ID ${id}`);
                }

                await new Promise(r => setTimeout(r, 80));
            }
        } finally {
            // Restore the normal adapter timeout
            if (modbus && modbus.client) {
                modbus.client.setTimeout(this.config.timeout || 5000);
            }
            // Only disconnect if we opened the connection ourselves
            if (ownConnection) {
                try { await modbus.disconnect(); } catch (_) {}
            }
        }

        this.log.info(`[SigenMicroScanner] Done: ${found.length} device(s) found`);
        return found;
    }
}

module.exports = SigenMicroScanner;
