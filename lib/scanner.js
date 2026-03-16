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
 * Reuses the adapter's existing ModbusConnection so no second TCP socket is opened.
 * Calls progressCb(text) after each ID for real-time progress reporting.
 */
class SigenMicroScanner {
	/**
	 * @param {object} config - Adapter native config
	 * @param {object} log    - Logger {debug, info, warn, error}
	 */
	constructor(config, log) {
		this.config = config;
		this.log = log || console;
	}

	/**
	 * Scan slave IDs [from…to] using an existing Modbus connection.
	 *
	 * @param {number}            from        - First slave ID (1–246)
	 * @param {number}            to          - Last slave ID (1–246)
	 * @param {ModbusConnection}  modbus      - Already-connected connection to reuse
	 * @param {Function}          [progressCb] - Called with (text: string)
	 * @returns {Promise<Array<{slaveId: number, model: string, serial: string, active: boolean}>>}
	 *   Found devices Found devices
	 */
	async scan(from, to, modbus, progressCb) {
		const skipIds = new Set([this.config.plantId || 247, this.config.inverterId || 1]);
		if (this.config.hasAcCharger) {
			skipIds.add(this.config.acChargerId || 2);
		}
		if (this.config.hasDcCharger) {
			skipIds.add(this.config.dcChargerId || 3);
		}

		const found = [];
		const total = to - from + 1;
		let probed = 0;

		let ownConnection = false;
		if (!modbus || !modbus.connected) {
			this.log.warn('[SigenMicroScanner] No active connection — creating temporary one');
			const cfg = Object.assign({}, this.config, { timeout: 1500 });
			modbus = new ModbusConnection(cfg, this.log);
			if (!(await modbus.connect())) {
				throw new Error('SigenMicro scan: cannot connect to Modbus');
			}
			ownConnection = true;
		}

		const skipList = [...skipIds].sort((a, b) => a - b).join(', ');
		this.log.info(`[SigenMicroScanner] Scan ${from}–${to}, skipping: ${skipList}`);

		if (progressCb) {
			progressCb(`Starting scan IDs ${from}–${to} (skipping: ${skipList})`);
		}

		try {
			for (let id = from; id <= to; id++) {
				probed++;
				const pct = Math.min(99, Math.round((probed / total) * 100));

				if (skipIds.has(id)) {
					this.log.debug(`[SigenMicroScanner] Skip ID ${id} (reserved)`);
					if (progressCb) {
						progressCb(`${pct}% — ID ${id} skipped (reserved)`);
					}
					continue;
				}

				if (progressCb) {
					progressCb(`${pct}% — probing ID ${id}…`);
				}

				try {
					modbus.client.setTimeout(1000);

					const modelRaw = await modbus.readHoldingRegisters(id, SIGENMICRO_IDENT_ADDR, SIGENMICRO_IDENT_QTY);
					const model = ModbusConnection.parseValue(modelRaw, 'STRING', null) || '';

					let serial = '';
					try {
						const serialRaw = await modbus.readHoldingRegisters(
							id,
							SIGENMICRO_SERIAL_ADDR,
							SIGENMICRO_SERIAL_QTY,
						);
						serial = ModbusConnection.parseValue(serialRaw, 'STRING', null) || '';
					} catch {
						// serial is optional
					}

					const displayModel = model.trim() || `SigenMicro-${id}`;
					this.log.info(`[SigenMicroScanner] ID ${id}: "${displayModel}" s/n="${serial.trim()}"`);
					found.push({ slaveId: id, model: displayModel, serial: serial.trim(), active: false });

					if (progressCb) {
						progressCb(`${pct}% — ID ${id}: found "${displayModel}"`);
					}
				} catch {
					this.log.debug(`[SigenMicroScanner] No response at ID ${id}`);
				}

				await new Promise((r) => setTimeout(r, 80));
			}
		} finally {
			modbus.client.setTimeout(this.config.timeout || 5000);
			if (ownConnection) {
				try {
					await modbus.disconnect();
				} catch {
					// ignore disconnect error
				}
			}
		}

		const summary = `100% — Scan complete: ${found.length} device(s) found`;
		this.log.info(`[SigenMicroScanner] ${summary}`);
		if (progressCb) {
			progressCb(summary);
		}
		return found;
	}
}

module.exports = SigenMicroScanner;
