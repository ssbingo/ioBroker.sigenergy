'use strict';

/*
 * ioBroker Sigenergy Adapter
 * Modbus TCP/RTU adapter for Sigenergy solar energy systems
 * Protocol: Sigenergy Modbus V2.5
 */

const utils = require('@iobroker/adapter-core');
const ModbusConnection = require('./lib/modbus');
const StatisticsCalculator = require('./lib/statistics');
const {
	PLANT_READ_REGISTERS,
	INVERTER_READ_REGISTERS,
	DC_CHARGER_READ_REGISTERS,
	AC_CHARGER_READ_REGISTERS,
} = require('./lib/registers');
const SigenMicroScanner = require('./lib/scanner');
const { getRegistersForDevice } = require('./lib/sigenMicroRegisters');

class Sigenergy extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options] - Adapter options
	 */
	constructor(options) {
		super({
			...options,
			name: 'sigenergy',
		});

		this.modbus = null;
		this.stats = new StatisticsCalculator();
		this._pollTimer = null;
		this._currentData = {};
		this._objectsCreated = false;
		this._sigenMicroDevices = [];

		this.on('ready', this.onReady.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Adapter started
	 */
	async onReady() {
		this.log.info(`Sigenergy adapter v${this.pack ? this.pack.version : '?'} starting...`);
		this.log.debug(
			`[onReady] Config: connectionType=${this.config.connectionType},` +
				` host=${this.config.tcpHost}:${this.config.tcpPort},` +
				` plantId=${this.config.plantId || 247},` +
				` inverterId=${this.config.inverterId || 1},` +
				` pollInterval=${this.config.pollInterval}ms,` +
				` timeout=${this.config.timeout}ms`,
		);
		this.log.debug(
			`Config: connectionType=${this.config.connectionType}, ` +
				`host=${this.config.tcpHost}:${this.config.tcpPort}, ` +
				`plantId=${this.config.plantId}, inverterId=${this.config.inverterId}, ` +
				`pollInterval=${this.config.pollInterval}ms, timeout=${this.config.timeout}ms`,
		);
		this.log.debug(
			`Components: battery=${this.config.hasBattery}, pv=${this.config.hasPv}, ` +
				`acCharger=${this.config.hasAcCharger}, dcCharger=${this.config.hasDcCharger}, ` +
				`sigenMicro=${this.config.hasSigenMicro}`,
		);
		this.setState('info.connection', false, true);

		// Load persisted SigenMicro device list from config
		try {
			const raw = this.config.sigenMicroDevices;
			this._sigenMicroDevices = raw && typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
		} catch {
			this._sigenMicroDevices = [];
		}
		const activeCount = this._sigenMicroDevices.filter((d) => d.active).length;
		if (this.config.hasSigenMicro) {
			this.log.info(
				`SigenMicro enabled: ${this._sigenMicroDevices.length} device(s) configured, ${activeCount} active`,
			);
		}

		// Migration: remove visWidgets from adapter object if present from older versions.
		try {
			const adapterObj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
			if (adapterObj && adapterObj.common && adapterObj.common.visWidgets) {
				this.log.info('Migration: removing legacy visWidgets from adapter object');
				delete adapterObj.common.visWidgets;
				delete adapterObj.common.restartAdapters;
				await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, adapterObj);
				this.log.info('Migration complete: visWidgets removed');
			}
		} catch (e) {
			this.log.warn(`Migration warning (visWidgets cleanup): ${e.message}`);
		}

		// Create Modbus connection
		this.modbus = new ModbusConnection(this.config, {
			debug: (msg) => this.log.debug(msg),
			info: (msg) => this.log.info(msg),
			warn: (msg) => this.log.warn(msg),
			error: (msg) => this.log.error(msg),
			setTimeout: (fn, ms) => this.setTimeout(fn, ms),
			clearTimeout: (t) => this.clearTimeout(t),
		});

		// Create all objects first
		await this._createObjects();

		// Connect and start polling
		await this._connectAndPoll();
	}

	/**
	 * Connect and start the polling loop
	 */
	async _connectAndPoll() {
		const target =
			this.config.connectionType === 'serial'
				? this.config.serialPort
				: `${this.config.tcpHost}:${this.config.tcpPort}`;
		this.log.info(`Connecting to ${this.config.connectionType === 'serial' ? 'serial' : 'TCP'} ${target}...`);
		const connected = await this.modbus.connect();
		if (connected) {
			this.log.info(`Successfully connected to ${target}`);
			this.setState('info.connection', true, true);
			this._startPolling();
		} else {
			this.log.warn(`Connection to ${target} failed — retrying in 30 seconds`);
			this.setState('info.connection', false, true);
			this._pollTimer = this.setTimeout(() => {
				this._connectAndPoll();
			}, 30000);
		}
	}

	/**
	 * Start the polling loop using setTimeout (not setInterval) to prevent
	 * overlapping poll cycles when Modbus requests take longer than the interval.
	 * Poll interval is clamped to [5 000 ms … 300 000 ms] (5 s – 5 min).
	 */
	_startPolling() {
		const MIN_INTERVAL = 5_000;
		const MAX_INTERVAL = 300_000;
		const raw = this.config.pollInterval || 10_000;
		this._pollInterval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, raw));
		if (this._pollInterval !== raw) {
			this.log.warn(
				`[poll] configured interval ${raw} ms out of range — clamped to ${this._pollInterval} ms`,
			);
		}
		this.log.info(`Starting polling every ${this._pollInterval} ms`);
		// Run first cycle immediately, subsequent cycles are scheduled by _scheduleNextPoll()
		this._poll();
	}

	/**
	 * Schedule the next poll cycle via setTimeout.
	 * Called at the end of each _poll() cycle so only one cycle runs at a time.
	 */
	_scheduleNextPoll() {
		if (this._pollTimer) {
			this.clearTimeout(this._pollTimer);
		}
		this._pollTimer = this.setTimeout(() => {
			this._poll();
		}, this._pollInterval);
	}

	/**
	 * Main polling function - reads all registers
	 */
	async _poll() {
		if (!this.modbus || !this.modbus.connected) {
			this.log.warn('Not connected, skipping poll — attempting reconnect in 5 seconds');
			this.setState('info.connection', false, true);
			if (this._pollTimer) {
				this.clearTimeout(this._pollTimer);
				this._pollTimer = null;
			}
			this._pollTimer = this.setTimeout(() => this._connectAndPoll(), 5000);
			return;
		}

		const _pollStart = Date.now();
		this.log.debug('[poll] cycle started');

		try {
			const _t0 = Date.now();
			await this._readPlant();
			this.log.debug(`[poll] plant read in ${Date.now() - _t0} ms`);
			await this._readInverter();

			if (this.config.hasAcCharger) {
				await this._readAcCharger();
			}
			if (this.config.hasDcCharger) {
				await this._readDcCharger();
			}
			if (this.config.hasSigenMicro) {
				await this._readSigenMicroDevices();
			}

			await this._updateStatistics();

			this.setState('info.connection', true, true);
			this.log.debug(`[poll] cycle completed in ${Date.now() - _pollStart} ms`);
		} catch (err) {
			this.log.error(`Poll error: ${err.message}`);
			this.setState('info.connection', false, true);
			this.modbus.connected = false;
		} finally {
			this._scheduleNextPoll();
		}
	}

	/**
	 * Read plant-level registers
	 */
	async _readPlant() {
		const plantId = this.config.plantId || 247;
		const batchSize = 120;
		const groups = this._buildReadGroups(PLANT_READ_REGISTERS, batchSize);
		this.log.debug(
			`Reading plant (slaveId=${plantId}): ${groups.length} group(s), ${PLANT_READ_REGISTERS.length} registers`,
		);

		for (const group of groups) {
			try {
				this.log.debug(`[plant] FC04 addr=${group.startAddr} qty=${group.totalQty}`);
				const raw = await this.modbus.readInputRegisters(plantId, group.startAddr, group.totalQty);
				await this._processReadGroup(group, raw, 'plant');
				await this._sleep(100);
			} catch (err) {
				this.log.warn(`Plant register read error at ${group.startAddr}: ${err.message}`);
			}
		}
	}

	/**
	 * Read inverter registers
	 */
	async _readInverter() {
		const inverterId = this.config.inverterId || 1;
		const batchSize = 60;
		const groups = this._buildReadGroups(INVERTER_READ_REGISTERS, batchSize);
		this.log.debug(
			`Reading inverter (slaveId=${inverterId}): ${groups.length} group(s),` +
				` ${INVERTER_READ_REGISTERS.length} registers`,
		);

		for (const group of groups) {
			try {
				const raw = await this.modbus.readInputRegisters(inverterId, group.startAddr, group.totalQty);
				await this._processReadGroup(group, raw, 'inverter');
				await this._sleep(100);
			} catch (err) {
				this.log.warn(`Inverter register read error at ${group.startAddr}: ${err.message}`);
			}
		}
	}

	/**
	 * Read AC Charger registers
	 */
	async _readAcCharger() {
		const acChargerId = this.config.acChargerId || 2;
		const batchSize = 30;
		const groups = this._buildReadGroups(AC_CHARGER_READ_REGISTERS, batchSize);
		this.log.debug(`Reading AC charger (slaveId=${acChargerId}): ${groups.length} group(s)`);

		for (const group of groups) {
			try {
				const raw = await this.modbus.readInputRegisters(acChargerId, group.startAddr, group.totalQty);
				await this._processReadGroup(group, raw, 'acCharger');
				await this._sleep(100);
			} catch (err) {
				this.log.warn(`AC Charger register read error: ${err.message}`);
			}
		}
	}

	/**
	 * Read DC Charger registers (via inverter slave)
	 */
	async _readDcCharger() {
		const inverterId = this.config.inverterId || 1;
		const batchSize = 10;
		const groups = this._buildReadGroups(DC_CHARGER_READ_REGISTERS, batchSize);
		this.log.debug(`Reading DC charger via inverter (slaveId=${inverterId}): ${groups.length} group(s)`);

		for (const group of groups) {
			try {
				const raw = await this.modbus.readInputRegisters(inverterId, group.startAddr, group.totalQty);
				await this._processReadGroup(group, raw, 'dcCharger');
				await this._sleep(100);
			} catch (err) {
				this.log.warn(`DC Charger register read error: ${err.message}`);
			}
		}
	}

	/**
	 * Read all active SigenMicro devices
	 */
	async _readSigenMicroDevices() {
		const activeDevices = this._sigenMicroDevices.filter((d) => d.active);
		if (activeDevices.length === 0) {
			return;
		}
		const _deviceIds = activeDevices.map((d) => d.slaveId).join(', ');
		this.log.debug(`[SigenMicro] Reading ${activeDevices.length} active device(s): IDs ${_deviceIds}`);

		for (const device of activeDevices) {
			const registers = getRegistersForDevice(device.slaveId);
			const batchSize = 30;
			const groups = this._buildReadGroups(registers, batchSize);
			this.log.debug(
				`[SigenMicro] device slaveId=${device.slaveId}` +
					` model='${device.model}': ${groups.length} group(s), ${registers.length} registers`,
			);

			for (const group of groups) {
				try {
					const raw = await this.modbus.readInputRegisters(device.slaveId, group.startAddr, group.totalQty);
					await this._processReadGroup(group, raw, `sigenmicro.${device.slaveId}`);
					await this._sleep(100);
				} catch (err) {
					this.log.warn(`SigenMicro ID ${device.slaveId} read error at ${group.startAddr}: ${err.message}`);
				}
			}
		}
	}

	/**
	 * Build optimized sequential read groups
	 *
	 * @param {object[]} registers - Register definitions
	 * @param {number} maxQty - Maximum registers per group
	 * @returns {object[]} Grouped register batches
	 */
	_buildReadGroups(registers, maxQty) {
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
	 * Process a read group and set states
	 *
	 * @param {object} group - Read group with registers and offsets
	 * @param {number[]} rawData - Raw register data from Modbus
	 * @param {string} _section - Section name (plant/inverter/etc.)
	 */
	async _processReadGroup(group, rawData, _section) {
		for (const reg of group.registers) {
			try {
				const slice = rawData.slice(reg.offset, reg.offset + reg.qty);
				if (slice.length < reg.qty) {
					continue;
				}

				const value = ModbusConnection.parseValue(slice, reg.type, reg.gain);
				const stateId = reg.name;
				this.log.debug(`[state] ${stateId} = ${value}${reg.unit ? ` ${reg.unit}` : ''}`);

				await this.setStateAsync(stateId, { val: value, ack: true });
				this._storeCurrentData(reg.name, value);
			} catch (e) {
				this.log.debug(`Error processing register ${reg.name}: ${e.message}`);
			}
		}
	}

	/**
	 * Store key values for statistics calculation
	 *
	 * @param {string} name - State name
	 * @param {number} value - State value
	 */
	_storeCurrentData(name, value) {
		const map = {
			'plant.essPower': 'essPower',
			'plant.pvPower': 'pvPower',
			'plant.gridActivePower': 'gridPower',
			'plant.essSoc': 'soc',
			'plant.essRatedEnergyCapacity': 'ratedCapacity',
			'plant.essDischargeSOC': 'cutoffSoc',
		};
		if (map[name] !== undefined) {
			this._currentData[map[name]] = value;
		}
	}

	/**
	 * Update and write statistics states
	 */
	async _updateStatistics() {
		this.stats.update(this._currentData);
		const statsValues = this.stats.getStats(this._currentData, this.config);

		const mapping = {
			'statistics.batteryTimeToFull': statsValues.batteryTimeToFull,
			'statistics.batteryTimeRemaining': statsValues.batteryTimeRemaining,
			'statistics.batteryDailyChargeTime': statsValues.batteryDailyChargeTime,
			'statistics.batteryCoverageToday': statsValues.batteryCoverageToday,
			'statistics.selfConsumptionRate': statsValues.selfConsumptionRate,
			'statistics.autarkyRate': statsValues.autarkyRate,
			'statistics.housePower': statsValues.housePower,
			'statistics.dayMaxSoc': statsValues.dayMaxSoc,
			'statistics.dayMinSoc': statsValues.dayMinSoc,
		};

		for (const [id, val] of Object.entries(mapping)) {
			if (val !== undefined && val !== null) {
				await this.setStateAsync(id, { val, ack: true });
			}
		}
	}

	/**
	 * Create all ioBroker objects/states
	 */
	async _createObjects() {
		if (this._objectsCreated) {
			return;
		}
		this._objectsCreated = true;
		this.log.debug('Creating ioBroker objects...');

		await this._createChannel('plant', 'Power Plant Data');
		await this._createChannel('plant.control', 'Plant Control');
		await this._createChannel('inverter', 'Hybrid Inverter');
		await this._createChannel('inverter.control', 'Inverter Control');
		await this._createChannel('statistics', 'Calculated Statistics');

		for (const reg of PLANT_READ_REGISTERS) {
			await this._createStateFromRegister(reg);
		}
		for (const reg of INVERTER_READ_REGISTERS) {
			await this._createStateFromRegister(reg);
		}

		if (this.config.hasAcCharger) {
			this.log.debug('Creating AC charger objects');
			await this._createChannel('acCharger', 'AC Charger');
			await this._createChannel('acCharger.control', 'AC Charger Control');
			for (const reg of AC_CHARGER_READ_REGISTERS) {
				await this._createStateFromRegister(reg);
			}
		}

		if (this.config.hasDcCharger) {
			this.log.debug('Creating DC charger objects');
			await this._createChannel('dcCharger', 'DC Charger');
			for (const reg of DC_CHARGER_READ_REGISTERS) {
				await this._createStateFromRegister(reg);
			}
		}

		if (this.config.hasSigenMicro) {
			await this._createSigenMicroObjects();
		}

		await this._createStatisticsStates();
		this.log.debug('All ioBroker objects created successfully');
	}

	/**
	 * Create a channel object
	 *
	 * @param {string} id - Channel ID
	 * @param {string} name - Channel display name
	 */
	async _createChannel(id, name) {
		await this.setObjectNotExistsAsync(id, {
			type: 'channel',
			common: { name },
			native: {},
		});
	}

	/**
	 * Create a state from a register definition
	 *
	 * @param {object} reg - Register definition
	 */
	async _createStateFromRegister(reg) {
		let type = 'number';
		let role = reg.role || 'value';

		if (reg.type === 'STRING') {
			type = 'string';
			role = reg.role || 'text';
		} else {
			type = 'number';
		}

		await this.setObjectNotExistsAsync(reg.name, {
			type: 'state',
			common: {
				name: reg.desc,
				type,
				role,
				unit: reg.unit || '',
				read: true,
				write: false,
			},
			native: {
				addr: reg.addr,
				qty: reg.qty,
				dataType: reg.type,
				gain: reg.gain,
			},
		});
	}

	/**
	 * Create ioBroker objects for all active SigenMicro devices
	 */
	async _createSigenMicroObjects() {
		const activeDevices = this._sigenMicroDevices.filter((d) => d.active);
		if (activeDevices.length === 0) {
			return;
		}

		this.log.debug(`Creating objects for ${activeDevices.length} active SigenMicro device(s)`);
		await this._createChannel('sigenmicro', 'SigenMicro Micro-Inverters');

		for (const device of activeDevices) {
			const channelId = `sigenmicro.${device.slaveId}`;
			await this._createChannel(channelId, device.model || `SigenMicro ID ${device.slaveId}`);
			const registers = getRegistersForDevice(device.slaveId);
			for (const reg of registers) {
				await this._createStateFromRegister(reg);
			}
		}
	}

	/**
	 * Create statistics state objects
	 */
	async _createStatisticsStates() {
		const statsStates = [
			{
				id: 'statistics.batteryTimeToFull',
				name: 'Time until battery is fully charged',
				type: 'number',
				unit: 'min',
				role: 'value',
			},
			{
				id: 'statistics.batteryTimeRemaining',
				name: 'Battery time remaining at current load',
				type: 'number',
				unit: 'min',
				role: 'value',
			},
			{
				id: 'statistics.batteryDailyChargeTime',
				name: 'Today: minutes until battery was full',
				type: 'number',
				unit: 'min',
				role: 'value',
			},
			{
				id: 'statistics.batteryCoverageToday',
				name: 'Today: minutes battery covered consumption',
				type: 'number',
				unit: 'min',
				role: 'value',
			},
			{
				id: 'statistics.selfConsumptionRate',
				name: 'Self-consumption rate',
				type: 'number',
				unit: '%',
				role: 'value.efficiency',
			},
			{
				id: 'statistics.autarkyRate',
				name: 'Autarky rate',
				type: 'number',
				unit: '%',
				role: 'value.efficiency',
			},
			{
				id: 'statistics.housePower',
				name: 'Calculated house consumption',
				type: 'number',
				unit: 'kW',
				role: 'value.power',
			},
			{
				id: 'statistics.dayMaxSoc',
				name: 'Today maximum SOC',
				type: 'number',
				unit: '%',
				role: 'value.battery',
			},
			{
				id: 'statistics.dayMinSoc',
				name: 'Today minimum SOC',
				type: 'number',
				unit: '%',
				role: 'value.battery',
			},
		];

		for (const s of statsStates) {
			await this.setObjectNotExistsAsync(s.id, {
				type: 'state',
				common: {
					name: s.name,
					type: s.type,
					role: s.role,
					unit: s.unit,
					read: true,
					write: false,
				},
				native: {},
			});
		}
	}


	/**
	 * Handle messages from admin (connection test, etc.)
	 *
	 * @param {object} obj - Message object
	 */
	async onMessage(obj) {
		if (!obj || !obj.command) {
			return;
		}

		if (obj.command === 'testConnection') {
			this.log.info(`[testConnection] received from=${obj.from}, hasCallback=${obj.callback != null}`);
			const testModbus = new ModbusConnection(obj.message, {
				debug: (m) => this.log.debug(m),
				info: (m) => this.log.info(m),
				warn: (m) => this.log.warn(m),
				error: (m) => this.log.error(m),
				setTimeout: (fn, ms) => this.setTimeout(fn, ms),
				clearTimeout: (t) => this.clearTimeout(t),
			});
			const hardTimeout = (obj.message && obj.message.timeout ? obj.message.timeout : 5000) + 3000;
			let result;
			try {
				result = await Promise.race([
					testModbus.testConnection(),
					new Promise((_, reject) =>
						this.setTimeout(() => reject(new Error('Test timed out — no response from device')), hardTimeout),
					),
				]);
			} catch (e) {
				result = { success: false, message: e.message };
			}
			this.log.info(`[testConnection] result: success=${result.success}, msg='${result.message}'`);
			this.sendTo(obj.from, obj.command, result, obj.callback);
			return;
		}

		if (obj.command === 'getSerialPorts') {
			const ports = await this._getSerialPorts();
			if (obj.callback) {
				this.sendTo(obj.from, obj.command, ports, obj.callback);
			}
		}

		if (obj.command === 'scanSigenMicro') {
			await this._handleScanSigenMicro(obj);
		}

		if (obj.command === 'saveSigenMicroDevices') {
			await this._handleSaveSigenMicroDevices(obj);
		}
	}

	/**
	 * Handle scanSigenMicro message from Admin tab
	 * Runs a Modbus scan and returns the found device list.
	 *
	 * @param {object} obj - ioBroker message object
	 */
	async _handleScanSigenMicro(obj) {
		if (!this.config.hasSigenMicro) {
			this.sendTo(
				obj.from,
				obj.command,
				{ success: false, message: 'SigenMicro is not enabled in adapter configuration.' },
				obj.callback,
			);
			return;
		}

		const msg = obj.message || {};
		const from = Math.max(
			1,
			parseInt(msg.scanFrom ?? msg.sigenMicroScanFrom, 10) || this.config.sigenMicroScanFrom || 10,
		);
		const to = Math.min(
			246,
			parseInt(msg.scanTo ?? msg.sigenMicroScanTo, 10) || this.config.sigenMicroScanTo || 30,
		);
		const fromJsonConfig = msg.tcpHost !== undefined || msg.connectionType !== undefined;

		this.log.info(
			`[scanSigenMicro] Starting scan ${from}–${to} (source: ${fromJsonConfig ? 'jsonConfig' : 'adminTab'})`,
		);

		// ── Pause polling so the scan can reuse the existing Modbus connection ──
		// Most Sigenergy devices accept only ONE simultaneous TCP connection on port 502.
		// Opening a second connection while polling is active causes the scan to fail silently.
		const wasPolling = !!this._pollTimer;
		if (wasPolling) {
			this.log.info('[scanSigenMicro] Pausing poll timer for scan duration');
			this.clearTimeout(this._pollTimer);
			this._pollTimer = null;
		}

		const scanner = new SigenMicroScanner(this.config, {
			debug: (m) => this.log.debug(m),
			info: (m) => this.log.info(m),
			warn: (m) => this.log.warn(m),
			error: (m) => this.log.error(m),
			setTimeout: (fn, ms) => this.setTimeout(fn, ms),
		});

		try {
			// Progress callback: writes to info.scanProgress state so admin UI can subscribe
			const progressCb = async (text) => {
				try {
					await this.setStateAsync('info.scanProgress', { val: text, ack: true });
				} catch {
					/* non-critical */
				}
			};

			await this.setStateAsync('info.scanStatus', { val: 'scanning', ack: true });
			await this.setStateAsync('info.scanProgress', { val: `Starting scan IDs ${from}–${to}…`, ack: true });

			const found = await scanner.scan(from, to, this.modbus, progressCb);
			const existing = Array.isArray(this._sigenMicroDevices) ? this._sigenMicroDevices : [];
			const merged = found.map((dev) => {
				const prev = existing.find((e) => e.slaveId === dev.slaveId);
				return { ...dev, active: prev ? !!prev.active : false };
			});

			await this.setStateAsync('info.scanStatus', { val: 'idle', ack: true });
			this.log.info(`[scanSigenMicro] Done: ${merged.length} device(s) found`);

			if (fromJsonConfig) {
				this._sigenMicroDevices = merged;
				try {
					const adapterObj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
					if (adapterObj) {
						adapterObj.native.sigenMicroDevices = JSON.stringify(merged);
						await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, adapterObj);
					}
				} catch (saveErr) {
					this.log.warn(`[scanSigenMicro] Could not auto-save: ${saveErr.message}`);
				}
				const deviceList = merged.map((d) => `${d.model} (ID ${d.slaveId})`).join(', ');
				const message =
					merged.length === 0
						? `No SigenMicro devices found in range ${from}–${to}. Check connection and ID range.`
						: `Found ${merged.length} device(s): ${deviceList}.` +
							` Use the SigenMicro admin tab to enable/disable devices.`;
				if (obj.callback) {
					this.sendTo(obj.from, obj.command, { success: true, message }, obj.callback);
				}
			} else {
				if (obj.callback) {
					this.sendTo(obj.from, obj.command, { success: true, devices: merged }, obj.callback);
				}
			}
		} catch (err) {
			this.log.error(`[scanSigenMicro] Error: ${err.message}`);
			try {
				await this.setStateAsync('info.scanStatus', { val: 'idle', ack: true });
			} catch {
				// ignore
			}
			if (obj.callback) {
				this.sendTo(obj.from, obj.command, { success: false, message: err.message }, obj.callback);
			}
		} finally {
			if (wasPolling) {
				this.log.info('[scanSigenMicro] Resuming poll timer after scan');
				this._scheduleNextPoll();
			}
		}
	}

	/**
	 * Handle saveSigenMicroDevices message from Admin tab.
	 * Persists the updated device list (with active flags) into the adapter config.
	 *
	 * @param {object} obj - ioBroker message object
	 */
	async _handleSaveSigenMicroDevices(obj) {
		const devices = obj.message && Array.isArray(obj.message.devices) ? obj.message.devices : [];
		this._sigenMicroDevices = devices;

		try {
			// Persist into adapter native config
			const adapterObj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
			if (adapterObj) {
				adapterObj.native.sigenMicroDevices = JSON.stringify(devices);
				await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, adapterObj);
			}

			// Re-create objects for newly activated devices
			this._objectsCreated = false;
			await this._createObjects();

			this.log.info(
				`[saveSigenMicroDevices] Saved ${devices.length} device(s),` +
					` ${devices.filter((d) => d.active).length} active`,
			);
			if (obj.callback) {
				this.sendTo(obj.from, obj.command, { success: true }, obj.callback);
			}
		} catch (err) {
			this.log.error(`[saveSigenMicroDevices] Error: ${err.message}`);
			if (obj.callback) {
				this.sendTo(obj.from, obj.command, { success: false, message: err.message }, obj.callback);
			}
		}
	}

	/**
	 * Get available serial ports
	 *
	 * @returns {Promise<object[]>} List of port objects
	 */
	async _getSerialPorts() {
		try {
			const { SerialPort } = require('serialport');
			const ports = await SerialPort.list();
			return ports.map((p) => ({
				value: p.path,
				label: `${p.path}${p.manufacturer ? ` (${p.manufacturer})` : ''}`,
			}));
		} catch {
			return [];
		}
	}

	/**
	 * Adapter shutdown
	 *
	 * @param {Function} callback - Completion callback
	 */
	async onUnload(callback) {
		try {
			this.log.info('Sigenergy adapter shutting down...');
			if (this._pollTimer) {
				this.clearTimeout(this._pollTimer);
				this._pollTimer = null;
				this.log.debug('Poll timer cleared');
			}
			if (this.modbus) {
				await this.modbus.disconnect();
				this.log.debug('Modbus disconnected');
			}
			this.setState('info.connection', false, true);
			this.log.info('Sigenergy adapter stopped');
		} catch (e) {
			this.log.error(`Unload error: ${e.message}`);
		}
		callback();
	}

	/**
	 * Sleep for given milliseconds
	 *
	 * @param {number} ms - Milliseconds to sleep
	 * @returns {Promise<void>}
	 */
	_sleep(ms) {
		return new Promise((resolve) => this.setTimeout(resolve, ms));
	}
}

// Export for compact mode support
if (require.main !== module) {
	module.exports = (options) => new Sigenergy(options);
} else {
	new Sigenergy();
}
