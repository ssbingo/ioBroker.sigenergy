"use strict";

/**
 * StatisticsCalculator - Computes derived/statistical values
 * from live Sigenergy inverter data
 */
class StatisticsCalculator {
    constructor() {
        // Rolling history for averages
        this._history = {
            essPower: [],        // Recent ESS power readings (kW)
            pvPower: [],         // Recent PV power readings (kW)
            gridPower: [],       // Recent grid power readings (kW)
            housePower: [],      // Calculated house consumption (kW)
            soc: [],             // SOC history with timestamps
        };
        this._maxHistory = 360; // Keep up to 360 entries (1 hour at 10s intervals)
        this._dayStart = this._getTodayStart();
        this._dayStats = {
            batteryFullTime: null,         // Time battery reached 100%
            batteryEmptyTime: null,        // Time battery was empty
            startSoc: null,                // SOC at day start
            maxSoc: 0,                     // Max SOC today
            minSoc: 100,                   // Min SOC today
            pvYieldToday: 0,               // kWh PV generated today (from register)
            gridFeedInToday: 0,            // kWh fed to grid today
            gridImportToday: 0,            // kWh imported from grid today
            chargeStartTime: null,
            chargeFullTime: null,
        };
    }

    _getTodayStart() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    /**
     * Update statistics with new readings
     * @param {object} data - Current values object
     */
    update(data) {
        const now = Date.now();

        // Check if day changed
        const todayStart = this._getTodayStart();
        if (todayStart !== this._dayStart) {
            this._dayStart = todayStart;
            this._resetDayStats();
        }

        // Push to history
        if (data.essPower !== undefined) {
            this._history.essPower.push({ ts: now, v: data.essPower });
            this._trimHistory("essPower");
        }
        if (data.pvPower !== undefined) {
            this._history.pvPower.push({ ts: now, v: data.pvPower });
            this._trimHistory("pvPower");
        }
        if (data.gridPower !== undefined) {
            this._history.gridPower.push({ ts: now, v: data.gridPower });
            this._trimHistory("gridPower");
        }
        if (data.soc !== undefined) {
            const soc = data.soc;
            this._history.soc.push({ ts: now, v: soc });
            this._trimHistory("soc");

            // Track day stats
            if (this._dayStats.startSoc === null) {
                this._dayStats.startSoc = soc;
            }
            if (soc > this._dayStats.maxSoc) this._dayStats.maxSoc = soc;
            if (soc < this._dayStats.minSoc) this._dayStats.minSoc = soc;

            // Track charge completion
            if (soc >= 99.5 && this._dayStats.batteryFullTime === null) {
                this._dayStats.batteryFullTime = now;
                if (this._dayStats.chargeStartTime !== null) {
                    this._dayStats.chargeFullTime = now;
                }
            }
            if (soc < 5 && this._dayStats.batteryEmptyTime === null) {
                this._dayStats.batteryEmptyTime = now;
            }
        }

        // Compute house power
        if (data.pvPower !== undefined && data.essPower !== undefined && data.gridPower !== undefined) {
            const housePower = data.pvPower + (-data.essPower) - data.gridPower;
            this._history.housePower.push({ ts: now, v: Math.max(0, housePower) });
            this._trimHistory("housePower");
        }
    }

    _trimHistory(key) {
        if (this._history[key].length > this._maxHistory) {
            this._history[key] = this._history[key].slice(-this._maxHistory);
        }
    }

    _resetDayStats() {
        this._dayStats = {
            batteryFullTime: null,
            batteryEmptyTime: null,
            startSoc: null,
            maxSoc: 0,
            minSoc: 100,
            pvYieldToday: 0,
            gridFeedInToday: 0,
            gridImportToday: 0,
            chargeStartTime: null,
            chargeFullTime: null,
        };
    }

    /**
     * Calculate time remaining to charge battery to 100%
     * @param {number} soc - Current SOC (%)
     * @param {number} essPower - Current ESS power (kW, >0 = charging)
     * @param {number} ratedCapacity - Rated battery capacity (kWh)
     * @returns {number|null} Minutes until full, or null if not charging
     */
    calcTimeToFull(soc, essPower, ratedCapacity) {
        if (essPower <= 0 || soc >= 100 || !ratedCapacity) return null;
        const remainingEnergy = ratedCapacity * (100 - soc) / 100; // kWh
        const minutes = (remainingEnergy / essPower) * 60;
        return Math.round(minutes);
    }

    /**
     * Calculate time remaining until battery is empty
     * @param {number} soc - Current SOC (%)
     * @param {number} essPower - Current ESS power (kW, <0 = discharging)
     * @param {number} ratedCapacity - Rated battery capacity (kWh)
     * @param {number} cutoffSoc - Discharge cutoff SOC (%)
     * @returns {number|null} Minutes until empty, or null if not discharging
     */
    calcTimeRemaining(soc, essPower, ratedCapacity, cutoffSoc = 10) {
        if (essPower >= 0 || soc <= cutoffSoc || !ratedCapacity) return null;
        const usableEnergy = ratedCapacity * (soc - cutoffSoc) / 100; // kWh
        const dischargePower = Math.abs(essPower);
        const minutes = (usableEnergy / dischargePower) * 60;
        return Math.round(minutes);
    }

    /**
     * How long today did the battery take to reach full charge
     * @returns {number|null} Minutes, or null if not reached full
     */
    calcDailyChargeTime() {
        if (!this._dayStats.batteryFullTime) return null;
        const startTs = this._dayStats.chargeStartTime || this._dayStart;
        return Math.round((this._dayStats.batteryFullTime - startTs) / 60000);
    }

    /**
     * How long today could the battery cover house consumption
     * (time during which grid power was <= 0 and battery was discharging)
     * @returns {number} Minutes
     */
    calcBatteryCoverageToday() {
        const now = Date.now();
        const gridHistory = this._history.gridPower.filter(e => e.ts >= this._dayStart);
        const essHistory = this._history.essPower.filter(e => e.ts >= this._dayStart);

        if (gridHistory.length < 2) return 0;

        let coverageMs = 0;
        for (let i = 1; i < gridHistory.length; i++) {
            const dt = gridHistory[i].ts - gridHistory[i - 1].ts;
            const gridVal = (gridHistory[i].v + gridHistory[i - 1].v) / 2;
            const essIdx = this._findNearestIndex(essHistory, gridHistory[i].ts);
            const essVal = essHistory[essIdx] ? essHistory[essIdx].v : 0;

            // Battery was covering consumption if: discharging AND grid power low
            if (essVal < -0.1 && gridVal < 0.1) {
                coverageMs += dt;
            }
        }
        return Math.round(coverageMs / 60000);
    }

    _findNearestIndex(arr, ts) {
        if (!arr || arr.length === 0) return -1;
        let best = 0;
        let bestDiff = Math.abs(arr[0].ts - ts);
        for (let i = 1; i < arr.length; i++) {
            const diff = Math.abs(arr[i].ts - ts);
            if (diff < bestDiff) { bestDiff = diff; best = i; }
        }
        return best;
    }

    /**
     * Calculate self-consumption rate (PV used locally / PV produced)
     * @param {number} pvPower - PV power (kW)
     * @param {number} gridPower - Grid power (kW, >0=import, <0=export)
     * @returns {number} Self-consumption rate (%)
     */
    calcSelfConsumptionRate(pvPower, gridPower) {
        if (pvPower <= 0) return 0;
        const export_ = gridPower < 0 ? Math.abs(gridPower) : 0;
        const selfUsed = Math.max(0, pvPower - export_);
        return Math.min(100, Math.round((selfUsed / pvPower) * 100 * 10) / 10);
    }

    /**
     * Calculate autarky rate (energy from PV+battery / total consumption)
     * @param {number} pvPower - PV power (kW)
     * @param {number} gridPower - Grid power (kW, >0=import)
     * @param {number} housePower - House consumption (kW)
     * @returns {number} Autarky rate (%)
     */
    calcAutarkyRate(pvPower, gridPower, housePower) {
        if (housePower <= 0) return 100;
        const gridImport = Math.max(0, gridPower);
        const fromLocal = Math.max(0, housePower - gridImport);
        return Math.min(100, Math.round((fromLocal / housePower) * 100 * 10) / 10);
    }

    /**
     * Get average power over last N minutes
     * @param {string} key - History key (pvPower, essPower, etc.)
     * @param {number} minutes - Window in minutes
     * @returns {number}
     */
    getAveragePower(key, minutes = 15) {
        const cutoff = Date.now() - minutes * 60000;
        const filtered = (this._history[key] || []).filter(e => e.ts >= cutoff);
        if (filtered.length === 0) return 0;
        return filtered.reduce((a, b) => a + b.v, 0) / filtered.length;
    }

    /**
     * Get all computed statistics
     * @param {object} currentData - Current live data
     * @param {object} config - Adapter config (for which stats to compute)
     * @returns {object}
     */
    getStats(currentData, config) {
        const stats = {};
        const cd = currentData || {};

        if (config.calcBatteryTimeToFull) {
            stats.batteryTimeToFull = this.calcTimeToFull(
                cd.soc, cd.essPower, cd.ratedCapacity
            );
        }
        if (config.calcBatteryTimeRemaining) {
            stats.batteryTimeRemaining = this.calcTimeRemaining(
                cd.soc, cd.essPower, cd.ratedCapacity, cd.cutoffSoc
            );
        }
        if (config.calcBatteryDailyFull) {
            stats.batteryDailyChargeTime = this.calcDailyChargeTime();
        }
        if (config.calcBatteryCoverageTime) {
            stats.batteryCoverageToday = this.calcBatteryCoverageToday();
        }
        if (config.calcSelfConsumptionRate) {
            stats.selfConsumptionRate = this.calcSelfConsumptionRate(
                cd.pvPower, cd.gridPower
            );
        }
        if (config.calcAutarkyRate) {
            const housePower = (cd.pvPower || 0) + Math.abs(cd.essPower || 0) - Math.max(0, cd.gridPower || 0);
            stats.autarkyRate = this.calcAutarkyRate(
                cd.pvPower, cd.gridPower, housePower
            );
        }
        if (config.calcPvYield) {
            stats.pvYieldAvg15m = this.getAveragePower("pvPower", 15);
        }

        // House power (derived)
        if (cd.pvPower !== undefined && cd.essPower !== undefined && cd.gridPower !== undefined) {
            stats.housePower = Math.max(0,
                (cd.pvPower || 0) + Math.abs(cd.essPower < 0 ? cd.essPower : 0) - Math.max(0, cd.gridPower || 0)
            );
        }

        // Day statistics
        stats.dayMaxSoc = this._dayStats.maxSoc;
        stats.dayMinSoc = this._dayStats.minSoc;

        return stats;
    }

    /**
     * Format minutes into human-readable string
     * @param {number|null} minutes
     * @returns {string}
     */
    static formatDuration(minutes) {
        if (minutes === null || minutes === undefined) return "N/A";
        if (minutes < 0) return "N/A";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
}

module.exports = StatisticsCalculator;
