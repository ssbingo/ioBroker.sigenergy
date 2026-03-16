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

> **Note:** All 7 widgets are provided by the separate [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy) adapter. Install it alongside this adapter to use the widgets in VIS-2.

### Energy Flow Widget
Shows animated energy flow between PV → Battery ↔ Grid → House.

### Battery Status Widget
Displays SOC bar, SOH badge, time to full/empty, current power.

### Power Overview Widget
Live reading of all four power flows.

### Statistics Widget
Today's autarky, self-consumption, SOC min/max, battery coverage time.

### Inverter Widget
Live inverter data: PV power, grid frequency, phase voltages, temperature.

### AC Charger Widget (EVAC)
Status and power readings for the Sigen EVAC charging station.

### DC Charger Widget
Status and power readings for the DC charger.

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
### 1.7.0 (2026-03-16)
* Replace HTML adminTab iframe with native jsonConfig tab (sigenmicro-tab.json); use type:state to show live scan progress (info.scanProgress state) directly in admin 7 React UI without any custom JavaScript

### 1.6.3 (2026-03-16)
* Fix scan progress display: replace all CSS-variable-dependent elements with a single always-visible log box using hardcoded colors; each chunk callback updates text immediately

### 1.6.2 (2026-03-16)
* Fix scan: restore proven chunked sendTo approach (3 IDs per call); add dual progress display: direct text update per chunk + getState polling from info.scanProgress state

### 1.6.1 (2026-03-16)
* Fix scan progress: replace unreliable subscribeState with setInterval+getState polling (500ms); extend safety timer to 2s per ID; dedicated _sendToAdapterRaw bypasses old 30s limit

### 1.6.0 (2026-03-16)
* Fix scan progress display: use ioBroker state subscription (info.scanProgress) instead of sendTo chunks; adapter writes progress per ID, admin page subscribes via socket.subscribeState for real-time updates

### 1.5.6 (2026-03-16)
* Replace invisible progress bar with plain text status line showing percentage and current ID range

### 1.5.5 (2026-03-16)
* Fix SigenMicro scan (root causes): reuse existing Modbus connection instead of opening a second TCP socket (device allows only one); pause polling during scan; fix duplicate scan start

### 1.5.4 (2026-03-16)
* Fix SigenMicro scan progress visibility: replace all CSS-class show/hide with direct element.style.display; reduce probe timeout to 1000ms; chunk size 3 for frequent bar updates

### 1.5.3 (2026-03-16)
* Fix SigenMicro scan progress: use max-height CSS transition + shimmer animation (no display:none conflicts); use requestAnimationFrame for reliable repaint between chunks

### 1.5.2 (2026-03-16)
* Fix SigenMicro scan tab: progress bar now visible; reserved IDs (Plant/Inverter/Charger) shown and auto-skipped; "no devices found" message always displayed

### 1.5.1 (2026-03-16)
* Add SigenMicro scan button directly in the jsonConfig admin tab; scan auto-saves discovered devices and shows a result summary

### 1.5.0 (2026-03-16)
* SigenMicro scan tab: prominent scan button, real-time chunked progress bar showing current ID range and live device count

### 1.4.1 (2026-03-16)
* Add SigenMicro micro-inverter support: Modbus scan, device discovery, per-device enable/disable, dedicated admin tab

### 1.4.0 (2026-03-14)
* Fixes / Cleaning

### 1.3.19 (2026-03-14)
* Revert eslint/@eslint/js to 9.x (peer conflict with @iobroker/eslint-config@2.2.0); bump serialport to 13.0.0

### 1.3.18 (2026-03-14)
* Bump eslint to 10.0.3, @eslint/js to 10.0.1, serialport to 13.0.0

### 1.3.17 (2026-03-13)
* Remove mocha from devDependencies (bundled in @iobroker/testing)

### 1.3.16 (2026-03-13)
* Restore mocha devDependency and fix test:package script

### 1.3.15 (2026-03-13)
* Fix indentation of setTimeout in testConnection Promise

### 1.3.14 (2026-03-13)
* Fix last two lint errors: collapse setTimeout in testConnection, use bare catch in _getSerialPorts

### 1.3.13 (2026-03-13)
* Fix all ESLint/Prettier errors: add JSDoc to all methods, fix formatting, remove unused imports

### 1.3.12 (2026-03-13)
* Fix curly-rule regression in modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Fix Prettier: add missing trailing commas in registers.js constant objects

### 1.3.10 (2026-03-13)
* Fix Prettier: expand inline register objects to multi-line format

### 1.3.9 (2026-03-13)
* Added documentation in README.md - multilingual

### 1.3.8 (2026-03-13)
* Add missing uk/zh-cn translations to io-package.json news

### 1.3.7 (2026-03-13)
* Remove redundant mocha devDependency (included in @iobroker/testing)

### 1.3.6 (2026-03-13)
* Fix Prettier/ESLint formatting: use tabs, single quotes, curly braces

### 1.3.5 (2026-03-13)
* (ssbingo) Fix CI: use explicit mocha binary path to avoid PATH resolution issues with npm ci

### 1.3.4 (2026-03-13)
* (ssbingo) Fix CI: add mocha to devDependencies so test:package script can run

### 1.3.3 (2026-03-13)
* (ssbingo) Fix duplicate @param JSDoc warning caused by missing closing tag in modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Code quality fixes: unused variables removed, JSDoc documentation completed, lexical declaration in switch-case fixed

### 1.3.0 (2026-03-13)
* (ssbingo) Multilingual documentation updated

### 1.2.5 (2026-03-12)
* (ssbingo) fixes

### 1.2.4 (2026-03-12)
* (ssbingo) Added multilingual documentation to README.md

### 1.2.3 (2026-03-12)
* (ssbingo) fixes for AdapterCheck

### 1.2.2 (2026-03-11)
* (ssbingo) fixes

### 1.2.1 (2026-03-11)
* (ssbingo) fixes

### 1.2.0 (2026-03-11)
* (ssbingo) Updated StatisticsCalculator: re-added battery time estimations, daily charge time and battery coverage tracking

### 1.1.9 (2026-03-11)
* (ssbingo) Replaced StatisticsCalculator with improved version: smoothed house power, corrected autarky and self-consumption formulas

### 1.1.8 (2026-03-11)
* (ssbingo) Corrected author information in package.json; cleaned up news entries in io-package.json

### 1.1.7 (2026-03-11)
* (ssbingo) Improved logging: added debug/info/warn/error messages for connection lifecycle, poll cycles, register reads and adapter shutdown

### 1.1.6 (2026-03-10)
* (ssbingo) Added release script to package.json

### 1.1.5 (2026-03-10)
* (ssbingo) Updated .releaseconfig.json: added manual-review plugin, removed before_commit hook

### 1.1.4 (2026-03-10)
* (ssbingo) Updated README: corrected VIS widget adapter name and link, added missing widget descriptions

### 1.1.3 (2026-03-09)
* (ssbingo) Fixed adapter-checker warnings and errors (news cleanup, deprecated fields)

### 1.1.2 (2026-03-10)
* (ssbingo) Fixed missing responsive size attributes in jsonConfig

### 1.1.1 (2026-03-09)
* (ssbingo) Fixed adapter-checker warnings and errors (news cleanup, deprecated fields)

### 1.1.0 (2026-03-09)
* (ssbingo) Migrated admin UI from legacy HTML to jsonConfig (Admin 5+)
* (ssbingo) Removed index.html, index_m.html, words.js

### 1.0.1 (2026-03-08)
* (ssbingo) Stable release: VIS-2 widgets moved to separate ioBroker.sigenergy-widgets adapter
* (ssbingo) Removed visWidgets and restartAdapters from io-package.json

### 0.4.11 (2026-03-08)
* (ssbingo) Extracted VIS-2 widgets into separate ioBroker.sigenergy-widgets adapter

### 0.4.10 (2026-03-08)
* (ssbingo) Fix VIS-1 liveview in vis-2: rewrite EJS templates to read vis.states[oid+'.val'] directly

### 0.4.9 (2026-03-08)
* (ssbingo) Fix vis-2 liveview: components list must match getWidgetInfo() IDs (tpl-prefixed)

### 0.4.8 (2026-03-08)
* (ssbingo) Fix vis-2 liveview: add window.visWidgets self-registration on module load

### 0.4.7 (2026-03-08)
* (ssbingo) Fix vis-2 liveview: removed bundlerType:module, now registers via window.visWidgets

### 0.4.6 (2026-03-08)
* (ssbingo) Fix vis-2 liveview: resolve VisRxWidget base class from shareScope (Module Federation)

### 0.4.5 (2026-03-08)
* (ssbingo) Fix vis-2 liveview: get() now waits for window.visRxWidget before creating widget classes

### 0.4.4 (2026-03-08)
* (ssbingo) Fix VIS-1 editor: removed non-standard EJS syntax; moved HTML into JS createXxx functions

### 0.4.3 (2026-03-08)
* (ssbingo) Fix: remove DOCTYPE from widget HTML fragment

### 0.4.2 (2026-03-08)
* (ssbingo) Fix VIS-1 widgets: correct vis.states access, add $div.data binding pattern

### 0.4.1 (2026-03-08)
* (ssbingo) Stable release: VIS-2 widgets working — correct palette group, React from shareScope

### 0.3.2 (2026-03-07)
* (ssbingo) Fixed: vis-2 widgets not appearing after adapter installation (`restartAdapters: ["vis-2"]` added)

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
* (ssbingo) Fix VIS-2 widget labels: use string translation keys instead of objects to prevent [object Object] in palette
* (ssbingo) Add translations module (get('./translations')) for proper i18n support
* (ssbingo) Fix io-package.json: add licenseInformation, connectionType, dataSource, js-controller/admin dependencies
* (ssbingo) Update adapter-core to ^3.3.2, @iobroker/testing to ^5.2.2

### 0.2.16 (2026-03-06)
* (ssbingo) VIS-2 Module Federation container interface: ES module with init()/get() exports
* (ssbingo) Switch to bundlerType: module for VIS-2 widget loading

### 0.2.15 (2026-03-06)
* (ssbingo) Fix VIS-2 widget registration; classes properly inherit VisRxWidget

### 0.2.14 (2026-03-06)
* (ssbingo) Fix VIS-2 widget palette: named export matches io-package.json key

### 0.2.9 (2026-03-05)
* (ssbingo) Fix VIS-2 widget loading: bundlerType=module for ES module dynamic import

### 0.2.7 (2026-03-05)
* (ssbingo) Fix VIS-1 widgets: OID attributes must start with "oid" for state auto-subscription

### 0.2.0 (2026-03-04)
* (ssbingo) Fixed VIS-1/VIS-2 widget registration; fixed DEP0060 deprecation

### 0.1.0 (2026-03-01)
* (ssbingo) Initial release — Modbus TCP/RTU support for Sigenergy systems

---

## Documentation

- 🇩🇪 [Deutsche Dokumentation](doc/de/README.md)
- 🇷🇺 [Документация на русском](doc/ru/README.md)
- 🇳🇱 [Nederlandse documentatie](doc/nl/README.md)
- 🇫🇷 [Documentation française](doc/fr/README.md)
- 🇮🇹 [Documentazione italiana](doc/it/README.md)
- 🇪🇸 [Documentación en español](doc/es/README.md)
- 🇵🇱 [Dokumentacja polska](doc/pl/README.md)
- 🇵🇹 [Documentação portuguesa](doc/pt/README.md)
- 🇺🇦 [Документація українською](doc/uk/README.md)
- 🇨🇳 [简体中文文档](doc/zh-cn/README.md)
