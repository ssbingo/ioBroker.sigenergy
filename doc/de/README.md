# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter für Sigenergy Solarenergieanlagen via Modbus TCP/RTU**

Unterstützt das Sigenergy Modbus Protokoll V2.9 (veröffentlicht 2026-05-13).

---

## Funktionen

- 📡 **Modbus TCP** (Ethernet / WLAN / Glasfaser / 4G) — Port 502
- 🔗 **Modbus RTU** (RS485 seriell)
- ⚡ **Vollständige Registerunterstützung** — Alle Anlagen-, Wechselrichter-, PSS- und PID-Register gemäß V2.9-Spezifikation
- 🔋 **Batteriestatistiken** — Zeit bis zur vollen Ladung, verbleibende Zeit, tägliche Abdeckung
- ☀️ **PV-Statistiken** — Eigenverbrauchsquote, Autarkiegrad
- 🔌 **AC-Ladegerät** (Sigen EVAC) — Optional
- ⚡ **DC-Ladegerät** — Optional
- 🏗️ **PSS** (Power Station Switch) — Optional, MV/NS-Schaltanlagen- und Verteilerüberwachung
- 🔍 **PID** (PV-Isolationsüberwachung) — Optional
- 🌡️ **ESS-Vorheizung** — TOU-Zeitplan, 30 konfigurierbare Zeitfenster (M1-HYA/HYB)
- 📈 **Erweiterte Register** — Smart Loads 1–24, Energiezähler, Netzcode-Parameter
- ☀️ **SigenMicro** — Mikrowechselrichter-Unterstützung (Auto-Scan)
- 📊 **Berechnete Werte** — Abgeleitete Statistiken werden bei jedem Abfragezyklus aktualisiert
- 🖥️ **VIS-Widgets** — Energiefluss, Batteriestatus, Statistikpanels

---

## Unterstützte Hardware

| Kategorie        | Modelle |
|-----------------|---------|
| **Hybrid-WR**   | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **PV-WR**       | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Standard Modbus-Adressen

| Gerät | Adresse |
|-------|---------|
| Anlage (lesen/schreiben) | **247** |
| Anlage Broadcast (schreiben, keine Antwort) | **0** |
| Wechselrichter | **1** |
| AC-Ladegerät (EVAC) | **2** |

---

## Konfiguration

### Reiter Verbindung
- **Verbindungstyp**: TCP (Ethernet) oder Seriell (RS485)
- **TCP-Host**: IP-Adresse des Wechselrichters
- **TCP-Port**: 502 (Standard)
- **Anlagen-Modbus-ID**: 247 (Standard)
- **Wechselrichter-Modbus-ID**: 1 (Standard)

### Reiter Komponenten
Auswahl der installierten Geräte:
- Batterie / ESS
- PV-Panele
- AC-Ladegerät (EVAC)
- DC-Ladegerät
- PSS (Power Station Switch)
- PID (PV-Isolationsüberwachung)
- ESS-Vorheizung (nur M1-HYA/HYB)
- SigenMicro (Mikrowechselrichter)

### Reiter Statistiken
Auswahl der zu berechnenden Statistikwerte:
- Zeit bis zur vollen Batterieladung
- Verbleibende Batteriezeit
- Tägliche Ladezeit
- Batterieabdeckungszeit
- Eigenverbrauchsquote
- Autarkiegrad

---

## Datenobjekte

### Anlage (`plant.*`)
| Status | Beschreibung | Einheit |
|--------|-------------|---------|
| `plant.gridActivePower` | Netzleistung (>0 Bezug, <0 Einspeisung) | kW |
| `plant.pvPower` | PV-Erzeugung | kW |
| `plant.essPower` | Batterieladeleistung (<0 Entladung) | kW |
| `plant.essSoc` | Batterieladezustand | % |
| `plant.activePower` | Gesamte Anlagenwirkleistung | kW |
| `plant.runningState` | Anlagenzustand (0=Standby, 1=Betrieb...) | - |

### Wechselrichter (`inverter.*`)
| Status | Beschreibung | Einheit |
|--------|-------------|---------|
| `inverter.pvPower` | PV-Leistung am Wechselrichter | kW |
| `inverter.essBatterySoc` | Batterie-SOC | % |
| `inverter.essBatterySoh` | Batterie-SOH | % |
| `inverter.essBatteryTemperature` | Batterietemperatur | °C |
| `inverter.phaseAVoltage` | Phase-A-Spannung | V |
| `inverter.gridFrequency` | Netzfrequenz | Hz |

### Statistiken (`statistics.*`)
| Status | Beschreibung | Einheit |
|--------|-------------|---------|
| `statistics.batteryTimeToFull` | Minuten bis zur vollen Batterie | min |
| `statistics.batteryTimeRemaining` | Verbleibende Batteriezeit | min |
| `statistics.selfConsumptionRate` | Eigenverbrauchsquote | % |
| `statistics.autarkyRate` | Autarkiegrad | % |
| `statistics.housePower` | Berechneter Hausverbrauch | kW |

---

## VIS-Widgets

> **Hinweis:** Alle 7 Widgets werden vom separaten Adapter [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy) bereitgestellt. Installiere diesen Adapter zusammen mit diesem Adapter, um die Widgets in VIS-2 zu verwenden.

### Energiefluss-Widget
Zeigt animierten Energiefluss zwischen PV → Batterie ↔ Netz → Haus.

### Batteriestatus-Widget
Zeigt SOC-Balken, SOH-Anzeige, Zeit bis voll/leer, aktuelle Leistung.

### Leistungsübersicht-Widget
Live-Anzeige aller vier Leistungsflüsse.

### Statistik-Widget
Heutige Autarkie, Eigenverbrauch, SOC min/max, Batterie-Abdeckungszeit.

### Wechselrichter-Widget
Live-Wechselrichterdaten: PV-Leistung, Netzfrequenz, Phasenspannungen, Temperatur.

### AC-Ladegerät-Widget (EVAC)
Status und Leistungswerte der Sigen EVAC Ladestation.

### DC-Ladegerät-Widget
Status und Leistungswerte des DC-Ladegeräts.

---

## Kommunikationsprotokoll

- Modbus TCP: TCP-Modus, Vollduplex, Port 502 (Slave)
- Modbus RTU: Halbduplex, 9600 bps, 8N1
- Mindest-Abfrageintervall: 1000 ms (1 Sekunde) gemäß Sigenergy-Spezifikation
- Timeout: 1000 ms gemäß Sigenergy-Spezifikation

---

## Changelog

### 2.3.2 (2026-06-10)
- (ssbingo) fix: 'pre-V2.6' statt 'unknown' wenn Gerät antwortet aber keine erweiterten Plant-Register hat; Debug-Log pro Probe mit Modbus-Exception-Meldung ergänzt

### 2.3.1 (2026-06-10)
- (ssbingo) feat: Modbus-Protokollebene beim Start durch Probe von Registern 30088/30200/30228/30286 erkennen; Firmware-Version (30525) lesen; Ergebnis loggen und als info.protocolLevel-State speichern

### 2.3.0 (2026-06-10)
- (ssbingo) feat: common.states Enum-Maps für emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState ergänzt; PSS/PID/AC-Ladegerät Schreib-Register (FC06/FC10) mit Subscribe und onStateChange-Handler verdrahtet

### 2.2.7 (2026-06-10)
- (ssbingo) Fix: fehlende native-Defaults enableSmartLoads/enableCumulativeEnergy/enableGridCode in io-package.json ergänzt
- (ssbingo) Fix: Register 30003 Beschreibung um V2.7 EMS-Modi 5 (FullFeedIn) und 9 (Custom) erweitert

### 2.2.6 (2026-06-10)
- (ssbingo) Neu: V2.9 Register-Audit — fehlendes Register 30279 ergänzt, DC-Charger PV-Register 31509/31511 in dcCharger-Namespace verschoben, ESS-Vorheizungs-TOU-Gain korrigiert
- (ssbingo) Neu: Steuerungs-Rückschreiben für plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); RW-Holding-Register beim Start gelesen
- (ssbingo) Fix: Wiederholte ESS-Vorheizungs-Warnungen nach nicht unterstützten Registern unterdrückt; Startup-Lesefehler der Control-Register auf Debug herabgestuft

### 2.2.4 (2026-06-10)
- (ssbingo) fix: ESS-Vorheizung TOU-Abfrage (FC03, 50000–50183, 94 Register) und Rückschreiben implementiert; encodeValue in ModbusConnection ergänzt

### 2.2.3 (2026-06-10)
- (ssbingo) fix: 25 fehlende Admin-i18n-Schlüssel in allen 11 Sprachen ergänzt (PSS, PID, ESS-Vorheizung, Erweiterte Register)

### 2.2.2 (2026-06-09)
- (ssbingo) docs: alle READMEs auf Modbus-Protokoll V2.9 aktualisiert — PSS, PID, ESS-Vorheizung, Erweiterte Register, SigenMicro ergänzt; Protokollversionsangabe korrigiert

### 2.2.1 (2026-06-09)
- (ssbingo) fix: PSS-Register-Tabelle auf 122 Einträge gemäß offiziellem Spec V2.9 korrigiert (Adressen, Gains, Typen); PSS-Schreibregister auf 6 WO-Einträge korrigiert; PID-Register 33055-33060 korrigiert (Typen, Gains, 2 fehlende Einträge)

### 2.2.0 (2026-06-09)
- (ssbingo) Feat: PSS (Power Station Switch) und PID (PV-Isolationsüberwachung) Unterstützung; ESS-Vorheizung TOU-Zeitplan-Register; neue Admin-Optionen für PSS/PID Slave-IDs

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Feat: Erweiterte Statistik — Plant-Statistik (30088–30097), Smart-Loads 1–24 (30098–30193), Kumulierte Energie (30194–30271), Regelungs-Feedback (30613–30619), Grid-Code-Parameter (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Feat: Modbus-Protokoll V2.9 — neue Plant/Wechselrichter/DC-Laderegler-Register, veraltete Register entfernt, Enums erweitert

### 1.9.17 (2026-06-08)
- (ssbingo) Fix: doppeltes i18n-Langformat entfernt (admin/i18n), /dev/ttyUSB0-Übersetzungsschlüssel hinzugefügt

### 1.9.16 (2026-06-08)
- (ssbingo) Chore: devDependency @alcalzone/release-script auf ^5.2.1 aktualisiert

### 1.9.15 (2026-06-08)
- (ssbingo) Chore: @tsconfig/node22 als devDependency hinzugefügt (ioBroker Template-Update)
- (ssbingo) Chore: testing-action-check auf @v2 aktualisiert
- (ssbingo) Chore: axios-Sicherheits-Update

### 1.9.14 (2026-05-27)
- (ssbingo) Fix: CI-Pipeline-Korrekturen — Node.js 24, @types/node ^22.0.0, package-lock.json korrigiert; nur neuester Eintrag in common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Fix: package-lock.json aktualisiert für @types/node ^22.0.0 (war auf 25.x eingefroren)

### 1.9.12 (2026-05-27)
- (ssbingo) Fix: @types/node auf ^22.0.0 in devDependencies gepinnt

### 1.9.11 (2026-05-27)
- (ssbingo) Fix: Node.js 24 für CI check-and-lint und deploy-Jobs
- (ssbingo) Chore: @types/node als devDependency hinzugefügt

### 1.9.10 (2026-05-27)
- (ssbingo) Abhängigkeits-Updates via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) CI-Aktualisierungen — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Abhängigkeits-Updates via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Benötigt nun Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) Fix: Deduplizierte Connection-/Poll-Fehler-Logs verhindern Log-Flooding und verbessern die Sentry-Readiness
- (ssbingo) Fix: Shutdown-Guards und extendForeignObject verhindern Race-Conditions beim Unload und mit der Admin-UI
- (ssbingo) Fix: Socket-Leak bei Modbus-Timeout behoben; testConnection pausiert jetzt das Polling; leere Control-Channels entfernt

### 1.9.7 (2026-04-16)
- (ssbingo) Neu: berechnete Datenpunkte plant.pv1Power, plant.pv2Power, plant.pv3Power hinzugefügt
