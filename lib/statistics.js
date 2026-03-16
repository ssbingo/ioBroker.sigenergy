'use strict';

/**
 * StatisticsCalculator - Computes derived statistical values for Sigenergy inverters
 * Includes house power, smoothing, and battery performance metrics.
 */
class StatisticsCalculator {
	/**
	 * Create a new StatisticsCalculator instance
	 */
	constructor() {
		this._history = {
			essPower: [], // kW: >0 charging, <0 discharging
			pvPower: [], // kW: PV generation
			gridPower: [], // kW: >0 import, <0 export
			housePower: [], // kW: Calculated consumption (smoothed)
			soc: [], // %: Battery State of Charge
		};

		// --- Smoothing & Filter Configuration ---
		this._smoothingBuffer = [];
		this._smoothingWindow = 5; // Average over the last 5 values
		this._thresholdKW = 0.005; // Ignore noise below 5 Watts

		this._maxHistory = 360; // 1 hour at 10s intervals
		this._dayStart = this._getTodayStart();
		this._dayStats = this._getDefaultDayStats();
	}

	/**
	 * Get the timestamp for the start of today
	 *
	 * @returns {number} Epoch milliseconds for midnight today
	 */
	_getTodayStart() {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	}

	/**
	 * Get default day statistics object
	 *
	 * @returns {object} Default day stats
	 */
	_getDefaultDayStats() {
		return {
			batteryFullTime: null,
			batteryEmptyTime: null,
			startSoc: null,
			maxSoc: 0,
			minSoc: 100,
			chargeStartTime: null,
		};
	}

	/**
	 * Central calculation of house consumption with filtering
	 * Formula: PV + Grid - Battery
	 *
	 * @param {number} pv - PV power in kW
	 * @param {number} grid - Grid power in kW (>0 import)
	 * @param {number} ess - ESS power in kW (>0 charging)
	 * @returns {number} Smoothed house power in kW
	 */
	_calculateSmoothHousePower(pv, grid, ess) {
		let rawPower = (pv || 0) + (grid || 0) - (ess || 0);

		if (rawPower < this._thresholdKW) {
			rawPower = 0;
		}

		this._smoothingBuffer.push(rawPower);
		if (this._smoothingBuffer.length > this._smoothingWindow) {
			this._smoothingBuffer.shift();
		}

		const sum = this._smoothingBuffer.reduce((a, b) => a + b, 0);
		return sum / this._smoothingBuffer.length;
	}

	/**
	 * Update history and day statistics with new sensor data
	 *
	 * @param {object} data - Current sensor readings
	 */
	update(data) {
		const now = Date.now();

		const todayStart = this._getTodayStart();
		if (todayStart !== this._dayStart) {
			this._dayStart = todayStart;
			this._dayStats = this._getDefaultDayStats();
			this._smoothingBuffer = [];
		}

		if (data.essPower !== undefined) {
			this._history.essPower.push({ ts: now, v: data.essPower });
		}
		if (data.pvPower !== undefined) {
			this._history.pvPower.push({ ts: now, v: data.pvPower });
		}
		if (data.gridPower !== undefined) {
			this._history.gridPower.push({ ts: now, v: data.gridPower });
		}

		if (data.pvPower !== undefined && data.essPower !== undefined && data.gridPower !== undefined) {
			const hp = this._calculateSmoothHousePower(data.pvPower, data.gridPower, data.essPower);
			this._history.housePower.push({ ts: now, v: hp });
		}

		if (data.soc !== undefined) {
			const soc = data.soc;
			this._history.soc.push({ ts: now, v: soc });

			if (this._dayStats.startSoc === null) {
				this._dayStats.startSoc = soc;
			}
			if (soc > this._dayStats.maxSoc) {
				this._dayStats.maxSoc = soc;
			}
			if (soc < this._dayStats.minSoc) {
				this._dayStats.minSoc = soc;
			}

			// Track daily battery metrics
			if (soc >= 99.5 && this._dayStats.batteryFullTime === null) {
				this._dayStats.batteryFullTime = now;
			}
			if (soc < 5 && this._dayStats.batteryEmptyTime === null) {
				this._dayStats.batteryEmptyTime = now;
			}
			if (data.essPower > 0.1 && this._dayStats.chargeStartTime === null) {
				this._dayStats.chargeStartTime = now;
			}
		}

		Object.keys(this._history).forEach((key) => this._trimHistory(key));
	}

	/**
	 * Trim history array to max length
	 *
	 * @param {string} key - History key to trim
	 */
	_trimHistory(key) {
		if (this._history[key].length > this._maxHistory) {
			this._history[key] = this._history[key].slice(-this._maxHistory);
		}
	}

	// --- Battery Estimation Methods ---

	/**
	 * Calculate minutes until battery is fully charged
	 *
	 * @param {number} soc - Current state of charge (%)
	 * @param {number} essPower - ESS power in kW (>0 charging)
	 * @param {number} ratedCapacity - Rated capacity in kWh
	 * @returns {number|null} Minutes to full, or null if not charging
	 */
	calcTimeToFull(soc, essPower, ratedCapacity) {
		if (essPower <= 0.05 || soc >= 100 || !ratedCapacity) {
			return null;
		}
		const remainingEnergy = (ratedCapacity * (100 - soc)) / 100;
		return Math.round((remainingEnergy / essPower) * 60);
	}

	/**
	 * Calculate minutes of battery remaining at current discharge rate
	 *
	 * @param {number} soc - Current state of charge (%)
	 * @param {number} essPower - ESS power in kW (<0 discharging)
	 * @param {number} ratedCapacity - Rated capacity in kWh
	 * @param {number} [cutoffSoc] - Minimum usable SOC (%)
	 * @returns {number|null} Minutes remaining, or null if not discharging
	 */
	calcTimeRemaining(soc, essPower, ratedCapacity, cutoffSoc = 10) {
		if (essPower >= -0.05 || soc <= cutoffSoc || !ratedCapacity) {
			return null;
		}
		const usableEnergy = (ratedCapacity * (soc - cutoffSoc)) / 100;
		return Math.round((usableEnergy / Math.abs(essPower)) * 60);
	}

	/**
	 * Calculate minutes today during which battery covered consumption
	 *
	 * @returns {number} Coverage minutes
	 */
	calcBatteryCoverageToday() {
		const gridHistory = this._history.gridPower.filter((e) => e.ts >= this._dayStart);
		const essHistory = this._history.essPower.filter((e) => e.ts >= this._dayStart);
		if (gridHistory.length < 2) {
			return 0;
		}

		let coverageMs = 0;
		for (let i = 1; i < gridHistory.length; i++) {
			const dt = gridHistory[i].ts - gridHistory[i - 1].ts;
			const gridVal = gridHistory[i].v;
			// Find nearest ESS value
			const essEntry = essHistory.reduce(
				(prev, curr) =>
					Math.abs(curr.ts - gridHistory[i].ts) < Math.abs(prev.ts - gridHistory[i].ts) ? curr : prev,
				essHistory[0],
			);

			// Covered if battery is discharging and grid import is near zero
			if (essEntry && essEntry.v < -0.05 && gridVal < 0.02) {
				coverageMs += dt;
			}
		}
		return Math.round(coverageMs / 60000);
	}

	/**
	 * Get all current statistics values
	 *
	 * @param {object} cd - Current sensor data
	 * @param {object} config - Adapter configuration
	 * @returns {object} Computed statistics
	 */
	getStats(cd, config) {
		const stats = {};
		const currentHousePower =
			this._smoothingBuffer.length > 0 ? this._smoothingBuffer[this._smoothingBuffer.length - 1] : 0;

		// Battery Time Calculations
		if (config.calcBatteryTimeToFull) {
			stats.batteryTimeToFull = this.calcTimeToFull(cd.soc, cd.essPower, cd.ratedCapacity);
		}
		if (config.calcBatteryTimeRemaining) {
			stats.batteryTimeRemaining = this.calcTimeRemaining(cd.soc, cd.essPower, cd.ratedCapacity, cd.cutoffSoc);
		}

		// Daily Battery Statistics
		if (config.calcBatteryDailyFull && this._dayStats.batteryFullTime) {
			const start = this._dayStats.chargeStartTime || this._dayStart;
			stats.batteryDailyChargeTime = Math.round((this._dayStats.batteryFullTime - start) / 60000);
		}

		if (config.calcBatteryCoverageTime) {
			stats.batteryCoverageToday = this.calcBatteryCoverageToday();
		}

		// Efficiency Rates
		if (config.calcSelfConsumptionRate) {
			const export_ = cd.gridPower < 0 ? Math.abs(cd.gridPower) : 0;
			const selfUsed = Math.max(0, (cd.pvPower || 0) - export_);
			stats.selfConsumptionRate =
				cd.pvPower > 0.01 ? Math.min(100, Math.round((selfUsed / cd.pvPower) * 1000) / 10) : 0;
		}

		if (config.calcAutarkyRate) {
			const gridImport = Math.max(0, cd.gridPower || 0);
			const fromLocal = Math.max(0, currentHousePower - gridImport);
			stats.autarkyRate =
				currentHousePower > 0.01 ? Math.min(100, Math.round((fromLocal / currentHousePower) * 1000) / 10) : 100;
		}

		stats.housePower = currentHousePower;
		stats.dayMaxSoc = this._dayStats.maxSoc;
		stats.dayMinSoc = this._dayStats.minSoc;

		return stats;
	}
}

module.exports = StatisticsCalculator;
