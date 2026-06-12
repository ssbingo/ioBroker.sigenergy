# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter for [Sigenergy](https://www.sigenergy.com) solar energy systems via Modbus TCP/RTU**

Supports the Sigenergy Modbus Protocol V2.9 (released 2026-05-13).

---

## Features

- 📡 **Modbus TCP** (Ethernet / WLAN / Optical fiber / 4G) — Port 502
- 🔗 **Modbus RTU** (RS485 Serial)
- ⚡ **Full register support** — All plant, inverter, PSS and PID registers per V2.9 spec
- 🔋 **Battery statistics** — Time to full, time remaining, daily coverage
- ☀️ **PV statistics** — Self-consumption rate, autarky rate
- 🔌 **AC Charger** (Sigen EVAC) — Optional
- ⚡ **DC Charger** — Optional
- 🏗️ **PSS** (Power Station Switch) — Optional, MV/LV switchgear and distribution cabinet monitoring
- 🔍 **PID** (PV Insulation Detection) — Optional
- 🌡️ **ESS Preheating** — TOU schedule, 30 configurable time windows (M1-HYA/HYB)
- 📈 **Extended registers** — Smart loads 1–24, cumulative energy, grid code parameters
- ☀️ **SigenMicro** — Micro-inverter support (auto-scan)
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
| PSS (Power Station Switch) | **5** (default, configurable) |
| PID (PV Insulation Detection) | **6** (default, configurable) |

---

## Device Types

Since v2.4.0 every adapter instance handles exactly **one** Sigenergy system type (strict either/or).
Select the type in the Components tab — or use **Auto-detect from device** to read it from the hardware.
Register sets are gated per the model footnotes of the official Modbus Protocol V2.9:

| Capability | SigenStor | Sigen Hybrid | Sigen PV M1-HYB | PV-only (PV Max) | SigenMicro-only |
|---|---|---|---|---|---|
| ESS / battery registers | always | optional | optional | — | — |
| DC charger | ✓ | ✓ | — | — | — |
| Grid code (40051-40068) | ✓ | ✓ | — | — | — |
| ESS preheating (50000-50183) | — | — | ✓ | — | — |
| PCC power factor (40157/40158) | — | — | ✓ | — | — |
| Plant registers (slave 247) | ✓ | ✓ | ✓ | ✓ | — |
| SigenMicro micro-inverters | optional | optional | optional | optional | ✓ |

One Modbus endpoint (IP/bus) = one instance. A SigenStor with additional SigenMicro micro-inverters
belongs in a **single** instance — the micros are an additive component, not a separate type.
Existing pre-2.4.0 configurations are migrated automatically (derived type is logged on startup —
please review the Components tab once).

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
- PSS (Power Station Switch)
- PID (PV Insulation Detection)
- ESS Preheating (M1-HYA/HYB only)
- SigenMicro (micro-inverters)

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

## Changelog

### 2.5.1 (2026-06-12)
- (ssbingo) fix: correct instanceObject role for info.modelType from 'info.name' to 'text' (W1133/W1135 adapter-checker warnings)

### 2.5.0 (2026-06-12)

- (ssbingo) Architectural write safety: Modbus writes are rejected in the write dispatcher itself when the target register is not valid for the configured device type (models gating in onStateChange, plant guard for SigenMicro-only)
- (ssbingo) TypeScript type check fixed — new `lib/adapter-config.d.ts` with full AdapterConfig declaration, typed modbus-serial constructor, ioBroker.CommonType/SettableObject annotations; new `npm run check` script passes with 0 errors
- (ssbingo) ESLint configuration allows JSDoc `@type` tags in this checked-JavaScript project (jsdoc/check-tag-names with typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Device type architecture: mandatory selector (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / PV-only inverter / SigenMicro-only) with strict either/or register gating per protocol V2.9 model footnotes
- (ssbingo) Sigen Hybrid and PV-only inverters (Sigen PV / PV Max) officially supported
- (ssbingo) Auto-detect device type from hardware in the admin UI (registers 30500 / 31024)
- (ssbingo) Model verification on startup — warns when configuration and detected hardware mismatch (new state info.modelType)
- (ssbingo) Dynamic PV string registers: PV5-PV16 voltage/current enabled by the string count reported in register 31025
- (ssbingo) PCC power factor controls (40157/40158) gated to Sigen PV M1-HYB; ESS preheating gated to M1-HYB; DC charger and grid code gated to SigenStor/Sigen Hybrid
- (ssbingo) Automatic migration of pre-2.4.0 configurations and cleanup of channels that are invalid for the selected device type

### 2.3.4 (2026-06-12)
- (ssbingo) fix: correct protocol level detection — use proper register quantities for probes, descend from V2.9 to V2.6, distinguish transport errors from device exceptions to avoid false pre-V2.6 report

### 2.3.3 (2026-06-11)
- (ssbingo) fix: suppress repeated register read warnings after first occurrence for plant/inverter/acCharger/dcCharger/pss/pid; subsequent failures log at debug level only

### 2.3.2 (2026-06-10)
- (ssbingo) fix: show 'pre-V2.6' instead of 'unknown' when device responds but has no extended plant registers; add per-probe debug log with Modbus exception message

### 2.3.1 (2026-06-10)
- (ssbingo) feat: detect Modbus protocol level on startup by probing registers 30088/30200/30228/30286; read firmware version (30525); log result and store as info.protocolLevel state

### 2.3.0 (2026-06-10)
- (ssbingo) feat: add common.states enum maps for emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState; wire PSS/PID/AC Charger write registers (FC06/FC10) with subscribe and onStateChange handlers

### 2.2.7 (2026-06-10)
- (ssbingo) fix: add missing native defaults enableSmartLoads/enableCumulativeEnergy/enableGridCode to io-package.json
- (ssbingo) fix: update register 30003 desc with V2.7 EMS modes 5 (FullFeedIn) and 9 (Custom)

### 2.2.6 (2026-06-10)
- (ssbingo) feat: V2.9 register audit — add missing register 30279 (current control command value), move DC Charger PV registers 31509/31511 to dcCharger namespace, fix ESS Preheating TOU time gain (null→1)
- (ssbingo) feat: implement control write-back for plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); read RW holding registers on startup
- (ssbingo) fix: suppress repeated ESS Preheating warn after device reports unsupported registers; downgrade control register startup read errors to debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: implement ESS Preheating TOU polling (FC03, 50000–50183, 94 registers) and write-back via onStateChange; add encodeValue to ModbusConnection

### 2.2.3 (2026-06-10)
- (ssbingo) fix: add 25 missing admin i18n keys for PSS, PID, ESS Preheating, Extended Registers across all 11 languages

### 2.2.2 (2026-06-09)
- (ssbingo) docs: update all READMEs to Modbus Protocol V2.9 — add PSS, PID, ESS Preheating, Extended Registers, SigenMicro; correct protocol version reference

### 2.2.1 (2026-06-09)
- (ssbingo) fix: correct PSS register table to 122 entries per official spec V2.9 (addresses, gains, types); fix PSS write registers to 6 WO entries; fix PID registers 33055-33060 (types, gains, 2 missing entries)

### 2.2.0 (2026-06-09)
- (ssbingo) feat: PSS (Power Station Switch) and PID (PV Insulation Detection) support; ESS Preheating TOU schedule registers; new admin options for PSS/PID slave IDs

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) feat: extended statistics — plant statistics (30088–30097), smart loads 1–24 (30098–30193), cumulative energy (30194–30271), adjustment feedback (30613–30619), grid code parameters (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) feat: Modbus Protocol V2.9 — new plant/inverter/DC charger registers, remove deprecated registers, extend enums

### 1.9.17 (2026-06-08)
- (ssbingo) fix: remove duplicate i18n long format (admin/i18n), add /dev/ttyUSB0 translation key

### 1.9.16 (2026-06-08)
- (ssbingo) chore: update devDependency @alcalzone/release-script to ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) chore: add @tsconfig/node22 devDependency (ioBroker template update)
- (ssbingo) chore: update testing-action-check to @v2
- (ssbingo) chore: bump axios (security fix)

### 1.9.14 (2026-05-27)
- (ssbingo) fix: CI pipeline fixes — Node.js 24, @types/node ^22.0.0, corrected package-lock.json; only latest entry in common.news

### 1.9.13 (2026-05-27)
- (ssbingo) fix: update package-lock.json to resolve @types/node ^22.0.0 (was locked to 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) fix: pin @types/node to ^22.0.0 in devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) fix: use Node.js 24 for CI check-and-lint and deploy jobs
- (ssbingo) chore: add @types/node devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) chore: Dependabot bumps — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) chore: CI updates — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) chore: dependency bumps via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) chore: requires Node.js >= 22 now

### 1.9.8 (2026-04-22)
- (ssbingo) fix: deduplicated connection/poll error logs to prevent log flooding and improve Sentry-readiness
- (ssbingo) fix: shutdown guards and extendForeignObject prevent race conditions on unload and with admin UI
- (ssbingo) fix: closed socket leak on Modbus timeout; testConnection pauses polling; removed empty control channels

### 1.9.7 (2026-04-16)
- (ssbingo) feat: added calculated states plant.pv1Power, plant.pv2Power, plant.pv3Power


---

[Older changelogs can be found there](CHANGELOG_OLD.md)

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

## License
MIT License

Copyright (c) 2026 ssbingo <s.sternitzke@online.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
