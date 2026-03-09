# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter for Sigenergy solar energy systems via Modbus TCP/RTU**

Supports the Sigenergy Modbus Protocol V2.5 (released 2025-02-19).

---

## Features

- 📡 **Modbus TCP** (Ethernet / WLAN / Optical fiber / 4G) — Port 502
- 🔗 **Modbus RTU** (RS485 Serial)
- ⚡ **Full register support** — All plant and inverter registers per V2.5 spec
- 🔋 **Battery statistics** — Time to full, time remaining, daily coverage
- ☀️ **PV statistics** — Self-consumption rate, autarky rate
- 🔌 **AC Charger** (Sigen EVAC) — Optional
- ⚡ **DC Charger** — Optional
- 📊 **Calculated values** — Derived statistics updated each poll cycle

---

## Supported Hardware

| Category         | Models |
|-----------------|--------|
| **Hybrid Inv.** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **PV Inv.**     | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Default Modbus Addresses

| Device | Address |
|--------|---------|
| Plant (read/write) | **247** |
| Plant broadcast (write, no reply) | **0** |
| Inverter | **1** |
| AC Charger (EVAC) | **2** |

---

## Installation

### Via ioBroker Admin (recommended)
1. Open ioBroker Admin → Adapter
2. Search for "sigenergy"
3. Install

---

## Configuration

### Connection Tab
- **Connection Type**: TCP (Ethernet) or Serial (RS485)
- **TCP Host**: IP address of your inverter
- **TCP Port**: 502 (default)
- **Plant Modbus ID**: 247 (default)
- **Inverter Modbus ID**: 1 (default)

### Components Tab
Select which devices are installed:
- Battery / ESS
- PV Panels
- AC Charger (EVAC)
- DC Charger

### Statistics Tab
Choose which statistical values to calculate:
- Battery time to full
- Battery time remaining
- Daily charge time
- Battery coverage time
- Self-consumption rate
- Autarky rate

---

## Data Objects

### Plant (`plant.*`)
| State | Description | Unit |
|-------|-------------|------|
| `plant.gridActivePower` | Grid power (>0 import, <0 export) | kW |
| `plant.pvPower` | PV generation | kW |
| `plant.essPower` | Battery power (<0 discharge) | kW |
| `plant.essSoc` | Battery state of charge | % |
| `plant.activePower` | Total plant active power | kW |
| `plant.runningState` | Plant state (0=Standby, 1=Running...) | - |

### Inverter (`inverter.*`)
| State | Description | Unit |
|-------|-------------|------|
| `inverter.pvPower` | PV power at inverter | kW |
| `inverter.essBatterySoc` | Battery SOC | % |
| `inverter.essBatterySoh` | Battery SOH | % |
| `inverter.essBatteryTemperature` | Battery temperature | °C |
| `inverter.phaseAVoltage` | Phase A voltage | V |
| `inverter.gridFrequency` | Grid frequency | Hz |

### Statistics (`statistics.*`)
| State | Description | Unit |
|-------|-------------|------|
| `statistics.batteryTimeToFull` | Minutes until battery full | min |
| `statistics.batteryTimeRemaining` | Minutes of battery left | min |
| `statistics.selfConsumptionRate` | Self-consumption rate | % |
| `statistics.autarkyRate` | Autarky rate | % |
| `statistics.housePower` | Calculated house consumption | kW |

---

## Communication Protocol

- Modbus TCP: TCP mode, full duplex, port 502 (slave)
- Modbus RTU: Half duplex, 9600 bps, 8N1
- Min poll interval: 1000 ms (1 second) per Sigenergy spec
- Timeout: 1000 ms per Sigenergy spec

---

## License

MIT License — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.0.1 (2026-03-08)
* (ioBroker Community) Stable release — reiner Modbus-Datenadapter ohne VIS-Widgets

### 0.2.18 (2026-03-07)
* (ssbingo) Fix Repository-URL auf https://github.com/ssbingo/ioBroker.sigenergy.git
* (ssbingo) Doppeltes common.license entfernt (licenseInformation bereits vorhanden)
* (ssbingo) io-package.json Schema korrigiert: connectionType, dataSource, js-controller/admin Abhängigkeiten
* (ssbingo) @iobroker/adapter-core auf ^3.3.2, @iobroker/testing auf ^5.2.2 aktualisiert

### 0.1.0 (2026-03-01)
* (ioBroker Community) Erste Veröffentlichung — Modbus TCP/RTU Support für Sigenergy Anlagen
