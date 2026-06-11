'use strict';

/*
 * ioBroker Sigenergy Adapter
 * Modbus TCP/RTU adapter for Sigenergy solar energy systems
 * Protocol: Sigenergy Modbus V2.9
 */

const utils = require('@iobroker/adapter-core');
const ModbusConnection = require('./lib/modbus');
const StatisticsCalculator = require('./lib/statistics');
const {
    PLANT_READ_REGISTERS,
    INVERTER_READ_REGISTERS,
    DC_CHARGER_READ_REGISTERS,
    AC_CHARGER_READ_REGISTERS,
    PSS_READ_REGISTERS,
    PID_READ_REGISTERS,
    ESS_PREHEATING_WRITE_REGISTERS,
    PLANT_WRITE_REGISTERS,
    INVERTER_WRITE_REGISTERS,
    DC_CHARGER_WRITE_REGISTERS,
    AC_CHARGER_WRITE_REGISTERS,
    PSS_WRITE_REGISTERS,
    PID_WRITE_REGISTERS,
    RUNNING_STATES,
    EMS_WORK_MODES,
    REMOTE_EMS_MODES,
    DC_CHARGER_RUNNING_STATES,
} = require('./lib/registers');
const SigenMicroScanner = require('./lib/scanner');
const { getRegistersForDevice } = require('./lib/sigenMicroRegisters');
const adapterVersion = require('./package.json').version;

const ENUM_STATES_MAP = {
    'plant.emsWorkMode': EMS_WORK_MODES,
    'plant.runningState': RUNNING_STATES,
    'dcCharger.runningState': DC_CHARGER_RUNNING_STATES,
    'plant.control.remoteEmsMode': REMOTE_EMS_MODES,
};

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
        // Shutdown guard — set to true in onUnload so pending async operations
        // (modbus reads, scans, setTimeout-chains) can abort gracefully instead of
        // calling setStateAsync on a stopped adapter.
        this._stopped = false;
        this._controlRegistersRead = false;
        this._protocolDetected = false;
        this._essPreheatingUnsupported = false;
        this._plantUnsupportedGroups = new Set();
        this._inverterUnsupportedGroups = new Set();
        this._acChargerUnsupportedGroups = new Set();
        this._dcChargerUnsupportedGroups = new Set();
        this._pssUnsupportedGroups = new Set();
        this._pidUnsupportedGroups = new Set();

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Adapter started
     */
    async onReady() {
        this.log.info(`Sigenergy adapter v${adapterVersion} starting...`);
        this.log.debug(
            `[onReady] Config: connectionType=${this.config.connectionType}, ` +
                `host=${this.config.tcpHost}:${this.config.tcpPort}, ` +
                `plantId=${this.config.plantId || 247}, inverterId=${this.config.inverterId || 1}, ` +
                `pollInterval=${this.config.pollInterval}ms, timeout=${this.config.timeout}ms`,
        );
        this.log.debug(
            `Components: battery=${this.config.hasBattery}, pv=${this.config.hasPv}, ` +
                `acCharger=${this.config.hasAcCharger}, dcCharger=${this.config.hasDcCharger}, ` +
                `sigenMicro=${this.config.hasSigenMicro}`,
        );
        this.log.debug(
            `V2.x features: smartLoads=${this.config.enableSmartLoads}, ` +
                `cumulativeEnergy=${this.config.enableCumulativeEnergy}, ` +
                `gridCode=${this.config.enableGridCode}, ` +
                `pss=${this.config.enablePss}, pid=${this.config.enablePid}, ` +
                `essPreheating=${this.config.enableEssPreheating}`,
        );
        await this.setStateAsync('info.connection', { val: false, ack: true });

        // Load persisted SigenMicro device list from config
        try {
            const raw = this.config.sigenMicroDevices;
            this._sigenMicroDevices = raw && typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
        } catch {
            this._sigenMicroDevices = [];
        }
        const activeCount = this._sigenMicroDevices.filter(d => d.active).length;
        if (this.config.hasSigenMicro) {
            this.log.info(
                `SigenMicro enabled: ${this._sigenMicroDevices.length} device(s) configured, ${activeCount} active`,
            );
        }

        // Migration: remove visWidgets from adapter object if present from older versions.
        // Uses extendForeignObjectAsync (merge) instead of setForeignObjectAsync (overwrite)
        // to avoid racing with concurrent config changes from the admin UI.
        try {
            const adapterObj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
            if (adapterObj && adapterObj.common && adapterObj.common.visWidgets) {
                this.log.info('Migration: removing legacy visWidgets from adapter object');
                await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                    common: {
                        visWidgets: null,
                        restartAdapters: null,
                    },
                });
                this.log.info('Migration complete: visWidgets removed');
            }
        } catch (e) {
            this.log.warn(`Migration warning (visWidgets cleanup): ${e.message}`);
        }

        // Create Modbus connection
        this.modbus = new ModbusConnection(this.config, {
            debug: msg => this.log.debug(msg),
            info: msg => this.log.info(msg),
            warn: msg => this.log.warn(msg),
            error: msg => this.log.error(msg),
            setTimeout: (fn, ms) => this.setTimeout(fn, ms),
            clearTimeout: t => this.clearTimeout(t),
        });

        // Create all objects first
        await this._createObjects();
        if (this._stopped) {
            return;
        }

        // Connect and start polling
        await this._connectAndPoll();
    }

    /**
     * Connect and start the polling loop
     */
    async _connectAndPoll() {
        if (this._stopped) {
            return;
        }
        const target =
            this.config.connectionType === 'serial'
                ? this.config.serialPort
                : `${this.config.tcpHost}:${this.config.tcpPort}`;
        this.log.info(`Connecting to ${this.config.connectionType === 'serial' ? 'serial' : 'TCP'} ${target}...`);
        const connected = await this.modbus.connect();
        if (this._stopped) {
            return;
        }
        if (connected) {
            this.log.info(`Successfully connected to ${target}`);
            await this.setStateAsync('info.connection', { val: true, ack: true });
            this._startPolling();
        } else {
            // Note: individual failure messages are deduplicated inside modbus.connect().
            // We still log the retry intent once per attempt, but at DEBUG level after the
            // first failure so we do not flood the log during a long outage.
            this.log.debug(`Connection to ${target} failed — retrying in 30 seconds`);
            await this.setStateAsync('info.connection', { val: false, ack: true });
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
        if (this._stopped) {
            return;
        }
        const MIN_INTERVAL = 5_000;
        const MAX_INTERVAL = 300_000;
        const raw = this.config.pollInterval || 10_000;
        this._pollInterval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, raw));
        if (this._pollInterval !== raw) {
            this.log.warn(`[poll] configured interval ${raw} ms out of range — clamped to ${this._pollInterval} ms`);
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
        if (this._stopped) {
            return;
        }
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
        if (this._stopped) {
            return;
        }
        if (!this.modbus || !this.modbus.connected) {
            // Deduplicate: only log the "skipping poll" message once per outage.
            if (!this._pollWarnLogged) {
                this.log.warn('Not connected, skipping poll — attempting reconnect in 5 seconds');
                this._pollWarnLogged = true;
            } else {
                this.log.debug('Still not connected — waiting for reconnect cycle');
            }
            await this.setStateAsync('info.connection', { val: false, ack: true });
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
            if (!this._controlRegistersRead) {
                await this._readControlRegisters();
                this._controlRegistersRead = true;
            }
            if (!this._protocolDetected) {
                await this._detectProtocolLevel();
                this._protocolDetected = true;
            }

            const _t0 = Date.now();
            await this._readPlant();
            if (this._stopped) {
                return;
            }
            this.log.debug(`[poll] plant read in ${Date.now() - _t0} ms`);
            await this._readInverter();
            if (this._stopped) {
                return;
            }

            if (this.config.hasAcCharger) {
                await this._readAcCharger();
                if (this._stopped) {
                    return;
                }
            }
            if (this.config.hasDcCharger) {
                await this._readDcCharger();
                if (this._stopped) {
                    return;
                }
            }
            if (this.config.hasSigenMicro) {
                await this._readSigenMicroDevices();
                if (this._stopped) {
                    return;
                }
            }
            if (this.config.enablePss) {
                await this._readPss();
                if (this._stopped) {
                    return;
                }
            }
            if (this.config.enablePid) {
                await this._readPid();
                if (this._stopped) {
                    return;
                }
            }
            if (this.config.enableEssPreheating) {
                await this._readEssPreheating();
                if (this._stopped) {
                    return;
                }
            }

            await this._updateStatistics();
            await this._updatePvStringPowers();

            await this.setStateAsync('info.connection', { val: true, ack: true });
            // Successful cycle → reset dedup flags so next outage logs at ERROR level again.
            this._pollErrorKey = null;
            this._pollWarnLogged = false;
            this.log.debug(`[poll] cycle completed in ${Date.now() - _pollStart} ms`);
        } catch (err) {
            // Deduplicate: first occurrence → ERROR (visible + Sentry-worthy).
            // Identical subsequent errors → DEBUG, so a broken network does not flood the log.
            const key = `poll:${err.code || err.message}`;
            if (this._pollErrorKey !== key) {
                this.log.error(`Poll error: ${err.message}`);
                this._pollErrorKey = key;
            } else {
                this.log.debug(`Poll error (repeated): ${err.message}`);
            }
            await this.setStateAsync('info.connection', { val: false, ack: true });
            // Actively close the half-broken socket instead of only flipping the flag —
            // modbus-serial can leave the TCP connection in a partially open state after
            // a timeout, which would cause all subsequent reads to fail until we reconnect.
            try {
                await this.modbus.disconnect();
            } catch {
                // ignore disconnect errors during error cleanup
            }
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
        const activeRegs = PLANT_READ_REGISTERS.filter(r => !r.feature || this.config[r.feature]);
        const groups = this._buildReadGroups(activeRegs, batchSize);
        this.log.debug(`Reading plant (slaveId=${plantId}): ${groups.length} group(s), ${activeRegs.length} registers`);

        for (const group of groups) {
            if (this._stopped) {
                return;
            }
            try {
                this.log.debug(`[plant] FC04 addr=${group.startAddr} qty=${group.totalQty}`);
                const raw = await this.modbus.readInputRegisters(plantId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'plant');
                await this._sleep(100);
            } catch (err) {
                if (!this._plantUnsupportedGroups.has(group.startAddr)) {
                    this._plantUnsupportedGroups.add(group.startAddr);
                    this.log.warn(`Plant register read error at ${group.startAddr}: ${err.message}`);
                } else {
                    this.log.debug(`[plant] read error at ${group.startAddr}: ${err.message}`);
                }
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
            if (this._stopped) {
                return;
            }
            try {
                const raw = await this.modbus.readInputRegisters(inverterId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'inverter');
                await this._sleep(100);
            } catch (err) {
                if (!this._inverterUnsupportedGroups.has(group.startAddr)) {
                    this._inverterUnsupportedGroups.add(group.startAddr);
                    this.log.warn(`Inverter register read error at ${group.startAddr}: ${err.message}`);
                } else {
                    this.log.debug(`[inverter] read error at ${group.startAddr}: ${err.message}`);
                }
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
            if (this._stopped) {
                return;
            }
            try {
                const raw = await this.modbus.readInputRegisters(acChargerId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'acCharger');
                await this._sleep(100);
            } catch (err) {
                if (!this._acChargerUnsupportedGroups.has(group.startAddr)) {
                    this._acChargerUnsupportedGroups.add(group.startAddr);
                    this.log.warn(`AC Charger register read error at ${group.startAddr}: ${err.message}`);
                } else {
                    this.log.debug(`[acCharger] read error at ${group.startAddr}: ${err.message}`);
                }
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
            if (this._stopped) {
                return;
            }
            try {
                const raw = await this.modbus.readInputRegisters(inverterId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'dcCharger');
                await this._sleep(100);
            } catch (err) {
                if (!this._dcChargerUnsupportedGroups.has(group.startAddr)) {
                    this._dcChargerUnsupportedGroups.add(group.startAddr);
                    this.log.warn(`DC Charger register read error at ${group.startAddr}: ${err.message}`);
                } else {
                    this.log.debug(`[dcCharger] read error at ${group.startAddr}: ${err.message}`);
                }
            }
        }
    }

    async _readPss() {
        const pssId = this.config.pssSlaveId || 5;
        const batchSize = 50;
        const groups = this._buildReadGroups(PSS_READ_REGISTERS, batchSize);
        this.log.debug(`Reading PSS (slaveId=${pssId}): ${groups.length} group(s)`);

        for (const group of groups) {
            if (this._stopped) {
                return;
            }
            try {
                const raw = await this.modbus.readInputRegisters(pssId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'pss');
                await this._sleep(100);
            } catch (err) {
                if (!this._pssUnsupportedGroups.has(group.startAddr)) {
                    this._pssUnsupportedGroups.add(group.startAddr);
                    this.log.warn(`PSS register read error at ${group.startAddr}: ${err.message}`);
                } else {
                    this.log.debug(`[pss] read error at ${group.startAddr}: ${err.message}`);
                }
            }
        }
    }

    async _readPid() {
        const pidId = this.config.pidSlaveId || 6;
        const batchSize = 50;
        const groups = this._buildReadGroups(PID_READ_REGISTERS, batchSize);
        this.log.debug(`Reading PID (slaveId=${pidId}): ${groups.length} group(s)`);

        for (const group of groups) {
            if (this._stopped) {
                return;
            }
            try {
                const raw = await this.modbus.readInputRegisters(pidId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'pid');
                await this._sleep(100);
            } catch (err) {
                if (!this._pidUnsupportedGroups.has(group.startAddr)) {
                    this._pidUnsupportedGroups.add(group.startAddr);
                    this.log.warn(`PID register read error at ${group.startAddr}: ${err.message}`);
                } else {
                    this.log.debug(`[pid] read error at ${group.startAddr}: ${err.message}`);
                }
            }
        }
    }

    async _readEssPreheating() {
        if (this._essPreheatingUnsupported) {
            this.log.debug(
                '[essPreheating] Skipping — registers not supported by device (disable in adapter settings)',
            );
            return;
        }
        const plantId = this.config.plantId || 247;
        const batchSize = 50;
        const groups = this._buildReadGroups(ESS_PREHEATING_WRITE_REGISTERS, batchSize);
        this.log.debug(`Reading ESS Preheating (slaveId=${plantId}): ${groups.length} group(s)`);

        let failCount = 0;
        for (const group of groups) {
            if (this._stopped) {
                return;
            }
            try {
                this.log.debug(`[essPreheating] FC03 addr=${group.startAddr} qty=${group.totalQty}`);
                const raw = await this.modbus.readHoldingRegisters(plantId, group.startAddr, group.totalQty);
                await this._processReadGroup(group, raw, 'essPreheating');
                await this._sleep(100);
            } catch (err) {
                failCount++;
                this.log.debug(`[essPreheating] read error at ${group.startAddr}: ${err.message}`);
            }
        }
        if (failCount === groups.length && groups.length > 0) {
            this._essPreheatingUnsupported = true;
            this.log.warn(
                'ESS Preheating: all register groups failed (Modbus exception 2 — device does not support these registers). ' +
                    'Polling disabled for this session. Disable "ESS Preheating" in adapter settings to suppress this message.',
            );
        }
    }

    async _detectProtocolLevel() {
        const plantId = this.config.plantId || 247;
        const inverterId = this.config.inverterId || 1;

        const probes = [
            { addr: 30088, level: 'V2.6' },
            { addr: 30200, level: 'V2.7' },
            { addr: 30228, level: 'V2.8' },
            { addr: 30286, level: 'V2.9' },
        ];

        let detectedLevel = null;
        for (const probe of probes) {
            try {
                await this.modbus.readInputRegisters(plantId, probe.addr, 1);
                detectedLevel = probe.level;
            } catch (err) {
                this.log.debug(`[protocolProbe] addr=${probe.addr} (${probe.level}): ${err.message}`);
                break;
            }
        }

        let firmwareVersion = 'unknown';
        try {
            const raw = await this.modbus.readInputRegisters(inverterId, 30525, 15);
            firmwareVersion = ModbusConnection.parseValue(raw, 'STRING', null) || 'unknown';
        } catch {
            // not critical
        }

        const levelStr = detectedLevel ? `>=${detectedLevel}` : 'pre-V2.6';
        this.log.info(`Detected protocol level: ${levelStr} (firmware: ${firmwareVersion})`);
        await this.setStateAsync('info.protocolLevel', { val: levelStr, ack: true });
    }

    async _readControlRegisters() {
        const plantId = this.config.plantId || 247;
        const inverterId = this.config.inverterId || 1;
        this.log.debug('[controlRegs] Reading RW holding registers (one-time on startup)');

        const plantRw = PLANT_WRITE_REGISTERS.filter(r => r.perm === 'RW' && (!r.feature || this.config[r.feature]));
        if (plantRw.length > 0) {
            for (const group of this._buildReadGroups(plantRw, 50)) {
                if (this._stopped) {
                    return;
                }
                try {
                    const raw = await this.modbus.readHoldingRegisters(plantId, group.startAddr, group.totalQty);
                    await this._processReadGroup(group, raw, 'control');
                    await this._sleep(100);
                } catch (err) {
                    this.log.debug(`[controlRegs] plant addr=${group.startAddr}: ${err.message}`);
                }
            }
        }

        const invRw = INVERTER_WRITE_REGISTERS.filter(r => r.perm === 'RW');
        if (invRw.length > 0) {
            for (const group of this._buildReadGroups(invRw, 50)) {
                if (this._stopped) {
                    return;
                }
                try {
                    const raw = await this.modbus.readHoldingRegisters(inverterId, group.startAddr, group.totalQty);
                    await this._processReadGroup(group, raw, 'control');
                    await this._sleep(100);
                } catch (err) {
                    this.log.debug(`[controlRegs] inverter addr=${group.startAddr}: ${err.message}`);
                }
            }
        }

        if (this.config.hasDcCharger) {
            const dcRw = DC_CHARGER_WRITE_REGISTERS.filter(r => r.perm === 'RW');
            if (dcRw.length > 0) {
                for (const group of this._buildReadGroups(dcRw, 50)) {
                    if (this._stopped) {
                        return;
                    }
                    try {
                        const raw = await this.modbus.readHoldingRegisters(inverterId, group.startAddr, group.totalQty);
                        await this._processReadGroup(group, raw, 'control');
                        await this._sleep(100);
                    } catch (err) {
                        this.log.debug(`[controlRegs] dcCharger addr=${group.startAddr}: ${err.message}`);
                    }
                }
            }
        }
    }

    /**
     * Read all active SigenMicro devices
     */
    async _readSigenMicroDevices() {
        const activeDevices = this._sigenMicroDevices.filter(d => d.active);
        if (activeDevices.length === 0) {
            return;
        }
        const _deviceIds = activeDevices.map(d => d.slaveId).join(', ');
        this.log.debug(`[SigenMicro] Reading ${activeDevices.length} active device(s): IDs ${_deviceIds}`);

        for (const device of activeDevices) {
            if (this._stopped) {
                return;
            }
            const registers = getRegistersForDevice(device.slaveId);
            const batchSize = 30;
            const groups = this._buildReadGroups(registers, batchSize);
            this.log.debug(
                `[SigenMicro] device slaveId=${device.slaveId}` +
                    ` model='${device.model}': ${groups.length} group(s), ${registers.length} registers`,
            );

            for (const group of groups) {
                if (this._stopped) {
                    return;
                }
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
            if (this._stopped) {
                return;
            }
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
            'inverter.pv1Voltage': 'pv1Voltage',
            'inverter.pv1Current': 'pv1Current',
            'inverter.pv2Voltage': 'pv2Voltage',
            'inverter.pv2Current': 'pv2Current',
            'inverter.pv3Voltage': 'pv3Voltage',
            'inverter.pv3Current': 'pv3Current',
        };
        if (map[name] !== undefined) {
            this._currentData[map[name]] = value;
        }
    }

    /**
     * Update and write statistics states
     */
    async _updateStatistics() {
        if (this._stopped) {
            return;
        }
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
            if (this._stopped) {
                return;
            }
            if (val !== undefined && val !== null) {
                await this.setStateAsync(id, { val, ack: true });
            }
        }
    }

    /**
     * Calculate and write PV string powers (voltage × current / 1000)
     */
    async _updatePvStringPowers() {
        if (this._stopped) {
            return;
        }
        const strings = [
            { id: 'plant.pv1Power', v: 'pv1Voltage', i: 'pv1Current' },
            { id: 'plant.pv2Power', v: 'pv2Voltage', i: 'pv2Current' },
            { id: 'plant.pv3Power', v: 'pv3Voltage', i: 'pv3Current' },
        ];

        for (const s of strings) {
            if (this._stopped) {
                return;
            }
            const voltage = this._currentData[s.v];
            const current = this._currentData[s.i];
            if (voltage !== undefined && current !== undefined) {
                const power = Math.round(((voltage * current) / 1000) * 1000) / 1000;
                await this.setStateAsync(s.id, { val: power, ack: true });
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
        this.log.debug('Creating ioBroker objects...');

        try {
            await this._createChannel('plant', 'Power Plant Data');
            await this._createChannel('plant.statistics', 'Plant Statistics');
            await this._createChannel('inverter', 'Hybrid Inverter');
            await this._createChannel('statistics', 'Calculated Statistics');

            if (this.config.enableSmartLoads) {
                await this._createChannel('plant.smartLoad', 'Smart Loads');
                for (let i = 1; i <= 24; i++) {
                    await this._createChannel(`plant.smartLoad.${i}`, `Smart Load ${i}`);
                }
            }

            for (const reg of PLANT_READ_REGISTERS) {
                if (this._stopped) {
                    return;
                }
                if (reg.feature && !this.config[reg.feature]) {
                    continue;
                }
                await this._createStateFromRegister(reg);
            }

            // Plant control write states
            await this._createChannel('plant.control', 'Plant Control');
            if (this.config.enableGridCode) {
                await this._createChannel('plant.gridCode', 'Grid Code Parameters');
            }
            for (const reg of PLANT_WRITE_REGISTERS) {
                if (this._stopped) {
                    return;
                }
                if (reg.feature && !this.config[reg.feature]) {
                    continue;
                }
                await this._createWriteStateFromRegister(reg);
            }
            this.subscribeStates('plant.control.*');
            if (this.config.enableGridCode) {
                this.subscribeStates('plant.gridCode.*');
            }

            // Virtual PV string power states (calculated from voltage × current)
            for (const pvState of [
                { id: 'plant.pv1Power', desc: 'PV string 1 power' },
                { id: 'plant.pv2Power', desc: 'PV string 2 power' },
                { id: 'plant.pv3Power', desc: 'PV string 3 power' },
            ]) {
                if (this._stopped) {
                    return;
                }
                await this.setObjectNotExistsAsync(pvState.id, {
                    type: 'state',
                    common: {
                        name: pvState.desc,
                        type: 'number',
                        role: 'value.power',
                        unit: 'kW',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
            }

            for (const reg of INVERTER_READ_REGISTERS) {
                if (this._stopped) {
                    return;
                }
                await this._createStateFromRegister(reg);
            }

            // Inverter control write states
            await this._createChannel('inverter.control', 'Inverter Control');
            for (const reg of INVERTER_WRITE_REGISTERS) {
                if (this._stopped) {
                    return;
                }
                await this._createWriteStateFromRegister(reg);
            }
            this.subscribeStates('inverter.control.*');

            if (this.config.hasAcCharger) {
                this.log.debug('Creating AC charger objects');
                await this._createChannel('acCharger', 'AC Charger');
                for (const reg of AC_CHARGER_READ_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createStateFromRegister(reg);
                }
                await this._createChannel('acCharger.control', 'AC Charger Control');
                for (const reg of AC_CHARGER_WRITE_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createWriteStateFromRegister(reg);
                }
                this.subscribeStates('acCharger.control.*');
            }

            if (this.config.hasDcCharger) {
                this.log.debug('Creating DC charger objects');
                await this._createChannel('dcCharger', 'DC Charger');
                for (const reg of DC_CHARGER_READ_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createStateFromRegister(reg);
                }
                await this._createChannel('dcCharger.control', 'DC Charger Control');
                for (const reg of DC_CHARGER_WRITE_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createWriteStateFromRegister(reg);
                }
                this.subscribeStates('dcCharger.control.*');
            }

            if (this.config.hasSigenMicro) {
                await this._createSigenMicroObjects();
            }

            if (this.config.enablePss) {
                this.log.debug('Creating PSS objects');
                await this._createChannel('pss', 'Power Station Switch');
                await this._createChannel('pss.mv', 'MV Cabinet');
                await this._createChannel('pss.la', 'LA LV Switchgear');
                await this._createChannel('pss.lb', 'LB LV Switchgear');
                await this._createChannel('pss.transformer', 'Transformer');
                await this._createChannel('pss.dist', 'Distribution Cabinet');
                await this._createChannel('pss.control', 'PSS Control');
                for (const reg of PSS_READ_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createStateFromRegister(reg);
                }
                for (const reg of PSS_WRITE_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createWriteStateFromRegister(reg);
                }
                this.subscribeStates('pss.control.*');
            }

            if (this.config.enablePid) {
                this.log.debug('Creating PID objects');
                await this._createChannel('pid', 'PV Insulation Detection');
                await this._createChannel('pid.control', 'PID Control');
                for (const reg of PID_READ_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createStateFromRegister(reg);
                }
                for (const reg of PID_WRITE_REGISTERS) {
                    if (this._stopped) {
                        return;
                    }
                    await this._createWriteStateFromRegister(reg);
                }
                this.subscribeStates('pid.control.*');
            }

            if (this.config.enableEssPreheating) {
                this.log.debug('Creating ESS Preheating objects');
                await this._createChannel('plant.essPreheating', 'ESS Preheating');
                for (let n = 1; n <= 30; n++) {
                    await this._createChannel(`plant.essPreheating.tou${n}`, `TOU Window ${n}`);
                }
                for (const reg of ESS_PREHEATING_WRITE_REGISTERS) {
                    await this.setObjectNotExistsAsync(reg.name, {
                        type: 'state',
                        common: {
                            name: reg.desc,
                            type: 'number',
                            role: 'value',
                            unit: reg.unit || '',
                            read: true,
                            write: true,
                        },
                        native: { addr: reg.addr, qty: reg.qty, dataType: reg.type, gain: reg.gain },
                    });
                }
                this.subscribeStates('plant.essPreheating.*');
            }

            await this._createStatisticsStates();
            // Set the flag ONLY after every object has been created successfully.
            // If creation failed partway, the flag stays false so the next call retries.
            this._objectsCreated = true;
            this.log.debug('All ioBroker objects created successfully');
        } catch (err) {
            this._objectsCreated = false;
            this.log.error(`Error creating objects: ${err.message}`);
            throw err;
        }
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

        const common = {
            name: reg.desc,
            type,
            role,
            unit: reg.unit || '',
            read: true,
            write: false,
        };
        const states = ENUM_STATES_MAP[reg.name];
        if (states) {
            common.states = states;
        }

        await this.setObjectNotExistsAsync(reg.name, {
            type: 'state',
            common,
            native: {
                addr: reg.addr,
                qty: reg.qty,
                dataType: reg.type,
                gain: reg.gain,
            },
        });
    }

    async _createWriteStateFromRegister(reg) {
        const type = reg.type === 'STRING' ? 'string' : 'number';
        const common = {
            name: reg.desc,
            type,
            role: 'value',
            unit: reg.unit || '',
            read: reg.perm === 'RW',
            write: true,
        };
        const states = ENUM_STATES_MAP[reg.name];
        if (states) {
            common.states = states;
        }
        await this.setObjectNotExistsAsync(reg.name, {
            type: 'state',
            common,
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
        const activeDevices = this._sigenMicroDevices.filter(d => d.active);
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
     * @param {ioBroker.Object} obj - Message object
     */
    async onStateChange(id, state) {
        if (!state || state.ack) {
            return;
        }
        if (!this.modbus || !this.modbus.connected) {
            this.log.warn(`Cannot write state ${id}: Modbus not connected`);
            return;
        }
        const localId = id.replace(/^[^.]+\.\d+\./, '');

        // ESS Preheating writes (FC03/FC10)
        if (localId.startsWith('plant.essPreheating.')) {
            const reg = ESS_PREHEATING_WRITE_REGISTERS.find(r => r.name === localId);
            if (!reg) {
                return;
            }
            const plantId = this.config.plantId || 247;
            const raw = ModbusConnection.encodeValue(state.val, reg.type, reg.gain);
            try {
                if (raw.length === 1) {
                    await this.modbus.writeSingleRegister(plantId, reg.addr, raw[0]);
                } else {
                    await this.modbus.writeMultipleRegisters(plantId, reg.addr, raw);
                }
                await this.setStateAsync(id, { val: state.val, ack: true });
                this.log.debug(`[essPreheating] wrote ${localId} = ${state.val} → addr ${reg.addr}`);
            } catch (err) {
                this.log.error(`ESS Preheating write error for ${localId}: ${err.message}`);
            }
            return;
        }

        // Plant / Inverter / DC Charger control register writes
        let reg = null;
        let slaveId = null;
        let category = '';

        if (localId.startsWith('plant.control.') || localId.startsWith('plant.gridCode.')) {
            reg = PLANT_WRITE_REGISTERS.find(r => r.name === localId);
            slaveId = this.config.plantId || 247;
            category = 'plant';
        } else if (localId.startsWith('inverter.control.')) {
            reg = INVERTER_WRITE_REGISTERS.find(r => r.name === localId);
            slaveId = this.config.inverterId || 1;
            category = 'inverter';
        } else if (localId.startsWith('dcCharger.control.')) {
            reg = DC_CHARGER_WRITE_REGISTERS.find(r => r.name === localId);
            slaveId = this.config.inverterId || 1;
            category = 'dcCharger';
        } else if (localId.startsWith('pss.control.')) {
            reg = PSS_WRITE_REGISTERS.find(r => r.name === localId);
            slaveId = this.config.pssSlaveId || 5;
            category = 'pss';
        } else if (localId.startsWith('pid.control.')) {
            reg = PID_WRITE_REGISTERS.find(r => r.name === localId);
            slaveId = this.config.pidSlaveId || 6;
            category = 'pid';
        } else if (localId.startsWith('acCharger.control.')) {
            reg = AC_CHARGER_WRITE_REGISTERS.find(r => r.name === localId);
            slaveId = this.config.acChargerId || 2;
            category = 'acCharger';
        }

        if (!reg) {
            return;
        }

        const raw = ModbusConnection.encodeValue(state.val, reg.type, reg.gain);
        try {
            if (raw.length === 1) {
                await this.modbus.writeSingleRegister(slaveId, reg.addr, raw[0]);
            } else {
                await this.modbus.writeMultipleRegisters(slaveId, reg.addr, raw);
            }
            await this.setStateAsync(id, { val: state.val, ack: true });
            this.log.debug(`[${category}] wrote ${localId} = ${state.val} → addr ${reg.addr} slave ${slaveId}`);
        } catch (err) {
            this.log.error(`Control register write error for ${localId}: ${err.message}`);
        }
    }

    /**
     * @param {ioBroker.Object} obj - Message object
     */
    async onMessage(obj) {
        if (!obj || !obj.command) {
            return;
        }

        if (obj.command === 'testConnection') {
            this.log.info(`[testConnection] received from=${obj.from}, hasCallback=${obj.callback != null}`);

            // Sigenergy devices typically accept only ONE simultaneous TCP connection
            // on port 502. Opening a second connection while polling is active causes
            // the existing connection to be dropped. We therefore pause the poll timer
            // for the duration of the test, the same way _handleScanSigenMicro does it.
            const wasPolling = !!this._pollTimer;
            if (wasPolling) {
                this.log.debug('[testConnection] Pausing poll timer for test duration');
                this.clearTimeout(this._pollTimer);
                this._pollTimer = null;
            }

            const testModbus = new ModbusConnection(obj.message, {
                debug: m => this.log.debug(m),
                info: m => this.log.info(m),
                warn: m => this.log.warn(m),
                error: m => this.log.error(m),
                setTimeout: (fn, ms) => this.setTimeout(fn, ms),
                clearTimeout: t => this.clearTimeout(t),
            });
            const hardTimeout = (obj.message && obj.message.timeout ? obj.message.timeout : 5000) + 3000;
            let result;
            try {
                result = await Promise.race([
                    testModbus.testConnection(),
                    new Promise((_, reject) =>
                        this.setTimeout(
                            () => reject(new Error('Test timed out — no response from device')),
                            hardTimeout,
                        ),
                    ),
                ]);
            } catch (e) {
                result = { success: false, message: e.message };
            } finally {
                // Always clean up the test connection — even if the outer Promise.race
                // rejected on timeout, the underlying connectTCP may still be pending.
                try {
                    await testModbus.disconnect();
                } catch {
                    // ignore
                }
                if (wasPolling && !this._stopped) {
                    this.log.debug('[testConnection] Resuming poll timer');
                    this._scheduleNextPoll();
                }
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

        // Pass a getter so the scanner can check the adapter shutdown state on every ID.
        // This allows a long-running scan to abort immediately when onUnload is triggered,
        // instead of continuing for several minutes and calling setStateAsync on a dead adapter.
        const scanner = new SigenMicroScanner(this.config, {
            debug: m => this.log.debug(m),
            info: m => this.log.info(m),
            warn: m => this.log.warn(m),
            error: m => this.log.error(m),
            setTimeout: (fn, ms) => this.setTimeout(fn, ms),
            isStopped: () => this._stopped,
        });

        try {
            // Progress callback: writes to info.scanProgress state so admin UI can subscribe
            const progressCb = async text => {
                if (this._stopped) {
                    return;
                }
                try {
                    await this.setStateAsync('info.scanProgress', { val: text, ack: true });
                } catch {
                    /* non-critical */
                }
            };

            await this.setStateAsync('info.scanStatus', { val: 'scanning', ack: true });
            await this.setStateAsync('info.scanProgress', { val: `Starting scan IDs ${from}–${to}…`, ack: true });

            const found = await scanner.scan(from, to, this.modbus, progressCb);
            if (this._stopped) {
                return;
            }
            const existing = Array.isArray(this._sigenMicroDevices) ? this._sigenMicroDevices : [];
            const merged = found.map(dev => {
                const prev = existing.find(e => e.slaveId === dev.slaveId);
                return { ...dev, active: prev ? !!prev.active : false };
            });

            await this.setStateAsync('info.scanStatus', { val: 'idle', ack: true });
            this.log.info(`[scanSigenMicro] Done: ${merged.length} device(s) found`);

            if (fromJsonConfig) {
                this._sigenMicroDevices = merged;
                try {
                    // Use extendForeignObjectAsync (merge) instead of setForeignObjectAsync
                    // (overwrite) to avoid clobbering concurrent changes from the admin UI.
                    await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                        native: { sigenMicroDevices: JSON.stringify(merged) },
                    });
                } catch (saveErr) {
                    this.log.warn(`[scanSigenMicro] Could not auto-save: ${saveErr.message}`);
                }
                const deviceList = merged.map(d => `${d.model} (ID ${d.slaveId})`).join(', ');
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
            if (wasPolling && !this._stopped) {
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
            // Use extendForeignObjectAsync instead of get+set to avoid a read-modify-write
            // race with concurrent changes from the admin UI.
            await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                native: { sigenMicroDevices: JSON.stringify(devices) },
            });

            // Re-create objects for newly activated devices. Reset flag BEFORE calling
            // _createObjects so it actually runs through; _createObjects will set the
            // flag at the end on success, or leave it false on partial failure.
            this._objectsCreated = false;
            await this._createObjects();

            this.log.info(
                `[saveSigenMicroDevices] Saved ${devices.length} device(s),` +
                    ` ${devices.filter(d => d.active).length} active`,
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
            return ports.map(p => ({
                value: p.path,
                label: `${p.path}${p.manufacturer ? ` (${p.manufacturer})` : ''}`,
            }));
        } catch (err) {
            // The 'serialport' package relies on a native build which can fail on some
            // platforms. Surface the reason instead of silently returning an empty list,
            // so the user sees why no ports appear in the admin dropdown.
            this.log.warn(`Could not enumerate serial ports: ${err.message}`);
            return [];
        }
    }

    /**
     * Adapter shutdown
     *
     * @param {Function} callback - Completion callback
     */
    async onUnload(callback) {
        // Set the shutdown flag FIRST, before any async work, so any in-flight
        // async operation (modbus read, scan, setTimeout chain) can see it and abort
        // on its next loop iteration or guard check.
        this._stopped = true;
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
            try {
                await this.setStateAsync('info.connection', { val: false, ack: true });
            } catch {
                // Adapter may already be disconnected from the DB at this point — ignore.
            }
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
        return new Promise(resolve => this.setTimeout(resolve, ms));
    }
}

// Export for compact mode support
if (require.main !== module) {
    module.exports = options => new Sigenergy(options);
} else {
    new Sigenergy();
}
