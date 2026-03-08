"use strict";

/*
 * ioBroker Sigenergy Adapter
 * Modbus TCP/RTU adapter for Sigenergy solar energy systems
 * Protocol: Sigenergy Modbus V2.5
 */

// Fix DEP0060: util._extend is deprecated in Node 22+.
// Several transitive dependencies (e.g. http-proxy@1.18.1) still use it.
// Replacing it with Object.assign before any other require() suppresses
// the warning without affecting functionality.
(function patchUtilExtend() {
    const u = require("util");
    if (typeof u._extend === "function" && u._extend !== Object.assign) {
        u._extend = Object.assign;
    }
}());

const utils = require("@iobroker/adapter-core");
const ModbusConnection = require("./lib/modbus");
const StatisticsCalculator = require("./lib/statistics");
const {
    PLANT_READ_REGISTERS,
    INVERTER_READ_REGISTERS,
    DC_CHARGER_READ_REGISTERS,
    AC_CHARGER_READ_REGISTERS,
    RUNNING_STATES,
} = require("./lib/registers");

class Sigenergy extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options]
     */
    constructor(options) {
        super({
            ...options,
            name: "sigenergy",
        });

        this.modbus = null;
        this.stats = new StatisticsCalculator();
        this._pollTimer = null;
        this._currentData = {};
        this._objectsCreated = false;

        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    /**
     * Adapter started
     */
    async onReady() {
        this.log.info("Sigenergy adapter starting...");
        this.setState("info.connection", false, true);

        // Create Modbus connection
        this.modbus = new ModbusConnection(this.config, {
            debug: (msg) => this.log.debug(msg),
            info:  (msg) => this.log.info(msg),
            warn:  (msg) => this.log.warn(msg),
            error: (msg) => this.log.error(msg),
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
        const connected = await this.modbus.connect();
        if (connected) {
            this.setState("info.connection", true, true);
            this._startPolling();
        } else {
            this.setState("info.connection", false, true);
            // Retry in 30 seconds
            this._pollTimer = setTimeout(() => {
                this._connectAndPoll();
            }, 30000);
        }
    }

    /**
     * Start the polling interval
     */
    _startPolling() {
        const interval = this.config.pollInterval || 10000;
        this._pollTimer = setInterval(async () => {
            await this._poll();
        }, interval);

        // Immediate first poll
        this._poll();
    }

    /**
     * Main polling function - reads all registers
     */
    async _poll() {
        if (!this.modbus || !this.modbus.connected) {
            this.log.warn("Not connected, skipping poll");
            this.setState("info.connection", false, true);
            clearInterval(this._pollTimer);
            this._pollTimer = null;
            // Reconnect
            setTimeout(() => this._connectAndPoll(), 5000);
            return;
        }

        try {
            // Read plant data (slave 247)
            await this._readPlant();

            // Read inverter data (slave = inverterId)
            await this._readInverter();

            // Read AC Charger if enabled
            if (this.config.hasAcCharger) {
                await this._readAcCharger();
            }

            // Read DC Charger registers (part of inverter slave)
            if (this.config.hasDcCharger) {
                await this._readDcCharger();
            }

            // Calculate statistics
            await this._updateStatistics();

            this.setState("info.connection", true, true);
        } catch (err) {
            this.log.error(`Poll error: ${err.message}`);
            this.setState("info.connection", false, true);
            this.modbus.connected = false;
        }
    }

    /**
     * Read plant-level registers
     */
    async _readPlant() {
        const plantId = this.config.plantId || 247;
        const batchSize = 120; // Max registers per read

        // Build optimized read groups
        const groups = this._buildReadGroups(PLANT_READ_REGISTERS, batchSize);

        for (const group of groups) {
            try {
                const raw = await this.modbus.readInputRegisters(
                    plantId,
                    group.startAddr,
                    group.totalQty
                );
                await this._processReadGroup(group, raw, "plant");
                await this._sleep(100); // Small delay between batches
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

        for (const group of groups) {
            try {
                const raw = await this.modbus.readInputRegisters(
                    inverterId,
                    group.startAddr,
                    group.totalQty
                );
                await this._processReadGroup(group, raw, "inverter");
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

        for (const group of groups) {
            try {
                const raw = await this.modbus.readInputRegisters(
                    acChargerId,
                    group.startAddr,
                    group.totalQty
                );
                await this._processReadGroup(group, raw, "acCharger");
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

        for (const group of groups) {
            try {
                const raw = await this.modbus.readInputRegisters(
                    inverterId,
                    group.startAddr,
                    group.totalQty
                );
                await this._processReadGroup(group, raw, "dcCharger");
                await this._sleep(100);
            } catch (err) {
                this.log.warn(`DC Charger register read error: ${err.message}`);
            }
        }
    }

    /**
     * Build optimized sequential read groups
     * Groups consecutive registers to minimize read requests
     */
    _buildReadGroups(registers, maxQty) {
        if (!registers || registers.length === 0) return [];

        // Sort by address
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

                // Allow small gaps (up to 4 registers) within a group
                if (gap >= 0 && gap <= 4 && currentGroup.totalQty + gap + reg.qty <= maxQty) {
                    const offset = reg.addr - currentGroup.startAddr;
                    currentGroup.totalQty = Math.max(
                        currentGroup.totalQty,
                        offset + reg.qty
                    );
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
        if (currentGroup) groups.push(currentGroup);
        return groups;
    }

    /**
     * Process a read group and set states
     */
    async _processReadGroup(group, rawData, section) {
        for (const reg of group.registers) {
            try {
                const slice = rawData.slice(reg.offset, reg.offset + reg.qty);
                if (slice.length < reg.qty) continue;

                const value = ModbusConnection.parseValue(slice, reg.type, reg.gain);
                const stateId = reg.name;

                await this.setStateAsync(stateId, { val: value, ack: true });

                // Store in current data for statistics
                this._storeCurrentData(reg.name, value);
            } catch (e) {
                this.log.debug(`Error processing register ${reg.name}: ${e.message}`);
            }
        }
    }

    /**
     * Store key values for statistics calculation
     */
    _storeCurrentData(name, value) {
        const map = {
            "plant.essPower": "essPower",
            "plant.pvPower": "pvPower",
            "plant.gridActivePower": "gridPower",
            "plant.essSoc": "soc",
            "plant.essRatedEnergyCapacity": "ratedCapacity",
            "plant.essDischargeSOC": "cutoffSoc",
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

        // Write statistics states
        const mapping = {
            "statistics.batteryTimeToFull":      statsValues.batteryTimeToFull,
            "statistics.batteryTimeRemaining":   statsValues.batteryTimeRemaining,
            "statistics.batteryDailyChargeTime": statsValues.batteryDailyChargeTime,
            "statistics.batteryCoverageToday":   statsValues.batteryCoverageToday,
            "statistics.selfConsumptionRate":    statsValues.selfConsumptionRate,
            "statistics.autarkyRate":            statsValues.autarkyRate,
            "statistics.housePower":             statsValues.housePower,
            "statistics.dayMaxSoc":              statsValues.dayMaxSoc,
            "statistics.dayMinSoc":              statsValues.dayMinSoc,
        };

        for (const [id, val] of Object.entries(mapping)) {
            if (val !== undefined && val !== null) {
                await this.setStateAsync(id, { val, ack: true });
            }
        }

        // Formatted durations as strings
        await this.setStateAsync("statistics.batteryTimeToFullFormatted",
            { val: StatisticsCalculator.formatDuration(statsValues.batteryTimeToFull), ack: true });
        await this.setStateAsync("statistics.batteryTimeRemainingFormatted",
            { val: StatisticsCalculator.formatDuration(statsValues.batteryTimeRemaining), ack: true });
    }

    /**
     * Create all ioBroker objects/states
     */
    async _createObjects() {
        if (this._objectsCreated) return;
        this._objectsCreated = true;

        // Plant channel
        await this._createChannel("plant", "Power Plant Data");
        await this._createChannel("plant.control", "Plant Control");

        // Inverter channel
        await this._createChannel("inverter", "Hybrid Inverter");
        await this._createChannel("inverter.control", "Inverter Control");

        // Statistics channel
        await this._createChannel("statistics", "Calculated Statistics");

        // Create states from register definitions
        for (const reg of PLANT_READ_REGISTERS) {
            await this._createStateFromRegister(reg);
        }
        for (const reg of INVERTER_READ_REGISTERS) {
            await this._createStateFromRegister(reg);
        }

        // AC Charger
        if (this.config.hasAcCharger) {
            await this._createChannel("acCharger", "AC Charger");
            await this._createChannel("acCharger.control", "AC Charger Control");
            for (const reg of AC_CHARGER_READ_REGISTERS) {
                await this._createStateFromRegister(reg);
            }
        }

        // DC Charger
        if (this.config.hasDcCharger) {
            await this._createChannel("dcCharger", "DC Charger");
            for (const reg of DC_CHARGER_READ_REGISTERS) {
                await this._createStateFromRegister(reg);
            }
        }

        // Statistics states
        await this._createStatisticsStates();
    }

    async _createChannel(id, name) {
        await this.setObjectNotExistsAsync(id, {
            type: "channel",
            common: { name },
            native: {},
        });
    }

    async _createStateFromRegister(reg) {
        let type = "number";
        let role = reg.role || "value";

        if (reg.type === "STRING") {
            type = "string";
            role = reg.role || "text";
        } else if (reg.type === "U16" && reg.gain === null) {
            type = "number";
        }

        await this.setObjectNotExistsAsync(reg.name, {
            type: "state",
            common: {
                name: reg.desc,
                type,
                role,
                unit: reg.unit || "",
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

    async _createStatisticsStates() {
        const statsStates = [
            { id: "statistics.batteryTimeToFull",          name: "Time until battery is fully charged", type: "number", unit: "min",  role: "value" },
            { id: "statistics.batteryTimeToFullFormatted", name: "Time until fully charged (formatted)", type: "string", unit: "",    role: "text" },
            { id: "statistics.batteryTimeRemaining",       name: "Battery time remaining at current load", type: "number", unit: "min", role: "value" },
            { id: "statistics.batteryTimeRemainingFormatted", name: "Battery time remaining (formatted)", type: "string", unit: "",   role: "text" },
            { id: "statistics.batteryDailyChargeTime",     name: "Today: minutes until battery was full", type: "number", unit: "min", role: "value" },
            { id: "statistics.batteryCoverageToday",       name: "Today: minutes battery covered consumption", type: "number", unit: "min", role: "value" },
            { id: "statistics.selfConsumptionRate",        name: "Self-consumption rate", type: "number", unit: "%", role: "value.efficiency" },
            { id: "statistics.autarkyRate",                name: "Autarky rate", type: "number", unit: "%", role: "value.efficiency" },
            { id: "statistics.housePower",                 name: "Calculated house consumption", type: "number", unit: "kW", role: "value.power" },
            { id: "statistics.dayMaxSoc",                  name: "Today maximum SOC", type: "number", unit: "%", role: "value.battery" },
            { id: "statistics.dayMinSoc",                  name: "Today minimum SOC", type: "number", unit: "%", role: "value.battery" },
        ];

        for (const s of statsStates) {
            await this.setObjectNotExistsAsync(s.id, {
                type: "state",
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
     * Handle state changes (for writable states)
     */
    onStateChange(id, state) {
        if (!state || state.ack) return;
        this.log.debug(`State change: ${id} = ${state.val}`);
        // TODO: Handle write commands
    }

    /**
     * Handle messages from admin (connection test, etc.)
     */
    async onMessage(obj) {
        if (!obj || !obj.command) return;

        if (obj.command === "testConnection") {
            this.log.info(`[testConnection] received from=${obj.from}, hasCallback=${obj.callback != null}`);
            const testModbus = new ModbusConnection(obj.message, {
                debug: (m) => this.log.debug(m),
                info:  (m) => this.log.info(m),
                warn:  (m) => this.log.warn(m),
                error: (m) => this.log.error(m),
            });
            const hardTimeout = (obj.message && obj.message.timeout ? obj.message.timeout : 5000) + 3000;
            let result;
            try {
                result = await Promise.race([
                    testModbus.testConnection(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Test timed out — no response from device")), hardTimeout)
                    )
                ]);
            } catch (e) {
                result = { success: false, message: e.message };
            }
            this.log.info(`[testConnection] result: success=${result.success}, msg="${result.message}"`);
            // Always send result back — don't guard on obj.callback (0 is falsy but valid)
            this.sendTo(obj.from, obj.command, result, obj.callback);
            return;
        }

        if (obj.command === "getSerialPorts") {
            const ports = await this._getSerialPorts();
            if (obj.callback) {
                this.sendTo(obj.from, obj.command, ports, obj.callback);
            }
        }
    }

    async _getSerialPorts() {
        try {
            const { SerialPort } = require("serialport");
            const ports = await SerialPort.list();
            return ports.map(p => ({ value: p.path, label: `${p.path}${p.manufacturer ? ` (${p.manufacturer})` : ""}` }));
        } catch (e) {
            return [];
        }
    }

    /**
     * Adapter shutdown
     */
    async onUnload(callback) {
        try {
            if (this._pollTimer) {
                clearInterval(this._pollTimer);
                clearTimeout(this._pollTimer);
                this._pollTimer = null;
            }
            if (this.modbus) {
                await this.modbus.disconnect();
            }
            this.setState("info.connection", false, true);
        } catch (e) {
            this.log.error(`Unload error: ${e.message}`);
        }
        callback();
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for compact mode support
if (require.main !== module) {
    module.exports = (options) => new Sigenergy(options);
} else {
    new Sigenergy();
}
