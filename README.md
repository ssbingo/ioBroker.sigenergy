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
- 🖥️ **VIS Widgets** — Energy flow, battery status, statistics panels

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

### Manual / dev-server
```bash
cd /home/ssternitzke
cp -r ioBroker.sigenergy /opt/iobroker/node_modules/iobroker.sigenergy
cd /opt/iobroker
npm install iobroker.sigenergy
```

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

## VIS Widgets

### Energy Flow Widget
Shows animated energy flow between PV → Battery ↔ Grid → House.

### Battery Status Widget
Displays SOC bar, SOH badge, time to full/empty, current power.

### Power Overview Widget
Live reading of all four power flows.

### Statistics Widget
Today's autarky, self-consumption, SOC min/max, battery coverage time.

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
* (ioBroker Community) Stable release: VIS-2 widgets moved to separate ioBroker.sigenergy-widgets adapter
* (ioBroker Community) Removed visWidgets and restartAdapters from io-package.json

### 0.4.11 (2026-03-08)
* (ioBroker Community) Extracted VIS-2 widgets into separate ioBroker.sigenergy-widgets adapter

### 0.4.10 (2026-03-08)
* (ioBroker Community) Fix VIS-1 liveview in vis-2: rewrite EJS templates to read vis.states[oid+'.val'] directly

### 0.4.9 (2026-03-08)
* (ioBroker Community) Fix vis-2 liveview: components list must match getWidgetInfo() IDs (tpl-prefixed)

### 0.4.8 (2026-03-08)
* (ioBroker Community) Fix vis-2 liveview: add window.visWidgets self-registration on module load

### 0.4.7 (2026-03-08)
* (ioBroker Community) Fix vis-2 liveview: removed bundlerType:module, now registers via window.visWidgets

### 0.4.6 (2026-03-08)
* (ioBroker Community) Fix vis-2 liveview: resolve VisRxWidget base class from shareScope (Module Federation)

### 0.4.5 (2026-03-08)
* (ioBroker Community) Fix vis-2 liveview: get() now waits for window.visRxWidget before creating widget classes

### 0.4.4 (2026-03-08)
* (ioBroker Community) Fix VIS-1 editor: removed non-standard EJS syntax; moved HTML into JS createXxx functions

### 0.4.3 (2026-03-08)
* (ioBroker Community) Fix: remove DOCTYPE from widget HTML fragment

### 0.4.2 (2026-03-08)
* (ioBroker Community) Fix VIS-1 widgets: correct vis.states access, add $div.data binding pattern

### 0.4.1 (2026-03-08)
* (ioBroker Community) Stable release: VIS-2 widgets working — correct palette group, React from shareScope

### 0.3.2 (2026-03-07)
- Fixed: vis-2 widgets not appearing after adapter installation (`restartAdapters: ["vis-2"]` added)


### 0.3.1 (2026-03-07)
* (ssbingo) Version bump to 0.3.1
* (ssbingo) Fix VIS-2 widget labels: string keys instead of objects (resolves [object Object] in palette)
* (ssbingo) Update dependencies: adapter-core ^3.3.2, @iobroker/testing ^5.2.2

### 0.2.18 (2026-03-07)
* (ssbingo) Fix repository URL to https://github.com/ssbingo/ioBroker.sigenergy.git
* (ssbingo) Remove duplicate common.license (licenseInformation already declared)
* (ssbingo) Fix io-package.json schema: connectionType, dataSource, js-controller/admin dependencies
* (ssbingo) Update @iobroker/adapter-core to ^3.3.2, @iobroker/testing to ^5.2.2

### 0.2.17 (2026-03-07)
* (ioBroker Community) Fix VIS-2 widget labels: use string translation keys instead of objects to prevent [object Object] in palette
* (ioBroker Community) Add translations module (get('./translations')) for proper i18n support
* (ioBroker Community) Fix io-package.json: add licenseInformation, connectionType, dataSource, js-controller/admin dependencies
* (ioBroker Community) Update adapter-core to ^3.3.2, @iobroker/testing to ^5.2.2

### 0.2.16 (2026-03-06)
* (ioBroker Community) VIS-2 Module Federation container interface: ES module with init()/get() exports
* (ioBroker Community) Switch to bundlerType: module for VIS-2 widget loading

### 0.2.15 (2026-03-06)
* (ioBroker Community) Fix VIS-2 widget registration; classes properly inherit VisRxWidget

### 0.2.14 (2026-03-06)
* (ioBroker Community) Fix VIS-2 widget palette: named export matches io-package.json key

### 0.2.9 (2026-03-05)
* (ioBroker Community) Fix VIS-2 widget loading: bundlerType=module for ES module dynamic import

### 0.2.7 (2026-03-05)
* (ioBroker Community) Fix VIS-1 widgets: OID attributes must start with "oid" for state auto-subscription

### 0.2.0 (2026-03-04)
* (ioBroker Community) Fixed VIS-1/VIS-2 widget registration; fixed DEP0060 deprecation

### 0.1.0 (2026-03-01)
* (ioBroker Community) Initial release — Modbus TCP/RTU support for Sigenergy systems
