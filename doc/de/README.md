# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter für Sigenergy Solarenergieanlagen via Modbus TCP/RTU**

Unterstützt das Sigenergy Modbus Protokoll V2.5 (veröffentlicht 2025-02-19).

---

## Funktionen

- 📡 **Modbus TCP** (Ethernet / WLAN / Glasfaser / 4G) — Port 502
- 🔗 **Modbus RTU** (RS485 seriell)
- ⚡ **Vollständige Registerunterstützung** — Alle Anlagen- und Wechselrichterregister gemäß V2.5-Spezifikation
- 🔋 **Batteriestatistiken** — Zeit bis zur vollen Ladung, verbleibende Zeit, tägliche Abdeckung
- ☀️ **PV-Statistiken** — Eigenverbrauchsquote, Autarkiegrad
- 🔌 **AC-Ladegerät** (Sigen EVAC) — Optional
- ⚡ **DC-Ladegerät** — Optional
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

## Installation

### Über ioBroker Admin (empfohlen)
1. ioBroker Admin öffnen → Adapter
2. Nach „sigenergy" suchen
3. Installieren

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

## Lizenz

MIT-Lizenz — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.3.16 (2026-03-13)
* Mocha devDependency wiederhergestellt, test:package-Skript korrigiert

### 1.3.15 (2026-03-13)
* Einrückung von setTimeout in testConnection korrigiert

### 1.3.14 (2026-03-13)
* Letzte zwei Lint-Fehler behoben

### 1.3.13 (2026-03-13)
* Alle ESLint/Prettier-Fehler behoben: JSDoc ergänzt, Formatierung und ungenutzte Importe korrigiert

### 1.3.12 (2026-03-13)
* Curly-Regressionsfehler in modbus.js, statistics.js, main.js behoben

### 1.3.11 (2026-03-13)
* Prettier-Fix: fehlende abschließende Kommas in registers.js Konstantenobjekten ergänzt

### 1.3.10 (2026-03-13)
* Prettier-Fix: Inline-Register-Objekte auf mehrzeiliges Format expandiert

### 1.3.9 (2026-03-13)
* Einfügen Dokumentation in README.md - mehrsprachig

### 1.3.8 (2026-03-13)
* Fehlende uk/zh-cn Übersetzungen in io-package.json ergänzt

### 1.3.7 (2026-03-13)
* Redundante mocha devDependency entfernt (in @iobroker/testing enthalten)

### 1.3.6 (2026-03-13)
* Prettier/ESLint-Formatierung behoben: Tabs, einfache Anführungszeichen, geschweifte Klammern

### 1.3.5 (2026-03-13)
* (ssbingo) CI-Fix: expliziten mocha-Binärpfad verwenden, um PATH-Auflösungsprobleme mit npm ci zu vermeiden

### 1.3.4 (2026-03-13)
* (ssbingo) CI-Fix: mocha zu devDependencies hinzugefügt, damit das test:package-Skript ausgeführt werden kann

### 1.3.3 (2026-03-13)
* (ssbingo) Doppelten @param JSDoc-Hinweis durch fehlendes schließendes Tag in modbus.js behoben

### 1.3.2 (2026-03-13)
* (ssbingo) Code-Qualitätskorrekturen: unbenutzte Variablen entfernt, JSDoc-Dokumentation vervollständigt, lexikalische Deklaration im switch-case korrigiert

### 1.3.0 (2026-03-13)
* (ssbingo) Dokumentation mehrsprachig angepasst

### 1.2.5 (2026-03-12)
* (ssbingo) Fehlerbehebungen

### 1.2.4 (2026-03-12)
* (ssbingo) Einfügen Dokumentation in README.md - mehrsprachig

### 1.2.3 (2026-03-12)
* (ssbingo) fixes for AdapterCheck

### 1.2.2 (2026-03-11)
* (ssbingo) fixes

### 1.2.1 (2026-03-11)
* (ssbingo) fixes

### 1.2.0 (2026-03-11)
* (ssbingo) StatisticsCalculator aktualisiert: Batterie-Zeitschätzungen, tägliche Ladezeit und Batterie-Abdeckungsverfolgung wieder hinzugefügt

### 1.1.9 (2026-03-11)
* (ssbingo) StatisticsCalculator durch verbesserte Version ersetzt: geglättete Hausleistung, korrigierte Autarkie/Eigenverbrauch-Formeln

### 1.1.8 (2026-03-11)
* (ssbingo) Autoreninformationen in package.json korrigiert; News-Einträge in io-package.json bereinigt

### 1.1.7 (2026-03-11)
* (ssbingo) Verbessertes Logging: debug/info/warn/error Meldungen für Verbindungs-Lifecycle, Poll-Zyklen, Register-Lesevorgänge und Adapter-Shutdown

### 1.1.6 (2026-03-10)
* (ssbingo) Release-Script zu package.json hinzugefügt

### 1.1.5 (2026-03-10)
* (ssbingo) .releaseconfig.json aktualisiert: manual-review Plugin hinzugefügt, before_commit Hook entfernt

### 1.1.4 (2026-03-10)
* (ssbingo) README aktualisiert: VIS-Widget-Adaptername und Link korrigiert, fehlende Widget-Beschreibungen ergänzt

### 1.1.3 (2026-03-09)
* (ssbingo) Adapter-Checker Warnungen und Fehler behoben (News-Bereinigung, veraltete Felder)

### 1.1.2 (2026-03-10)
* (ssbingo) Fehlende responsive Größenattribute in jsonConfig behoben

### 1.1.1 (2026-03-09)
* (ssbingo) Adapter-Checker Fehler und Warnungen behoben; Admin-UI auf jsonConfig (Admin 5+) migriert; i18n-Unterstützung für 11 Sprachen hinzugefügt

### 1.1.0 (2026-03-09)
* (ssbingo) Admin-UI von Legacy-HTML auf jsonConfig (Admin 5+) migriert
* (ssbingo) index.html, index_m.html, words.js entfernt

### 1.0.1 (2026-03-08)
* (ssbingo) Stabiles Release: VIS-2 Widgets in separaten ioBroker.sigenergy-widgets Adapter ausgelagert
* (ssbingo) visWidgets und restartAdapters aus io-package.json entfernt

### 0.4.1 (2026-03-08)
* (ssbingo) Stabiles Release: VIS-2 Widgets funktionieren — korrekte Palettengruppe, React aus shareScope

### 0.1.0 (2026-03-01)
* (ssbingo) Erstveröffentlichung — Modbus TCP/RTU-Unterstützung für Sigenergy-Systeme

---

## Dokumentation

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Dokumentація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
