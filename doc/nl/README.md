# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter voor Sigenergy zonne-energiesystemen via Modbus TCP/RTU**

Ondersteunt het Sigenergy Modbus Protocol V2.5 (uitgebracht 2025-02-19).

---

## Functies

- 📡 **Modbus TCP** (Ethernet / WLAN / glasvezel / 4G) — poort 502
- 🔗 **Modbus RTU** (RS485 serieel)
- ⚡ **Volledige registerondersteuning** — alle installatie- en omvormerregisters per V2.5-specificatie
- 🔋 **Batterijstatistieken** — tijd tot volledig opladen, resterende tijd, dagelijkse dekking
- ☀️ **PV-statistieken** — eigenverbruiksgraad, autarkiegraad
- 🔌 **AC-oplader** (Sigen EVAC) — optioneel
- ⚡ **DC-oplader** — optioneel
- 📊 **Berekende waarden** — afgeleide statistieken bijgewerkt bij elke pollcyclus
- 🖥️ **VIS-widgets** — energiestroom, batteriistatus, statistiekpanelen

---

## Ondersteunde hardware

| Categorie        | Modellen |
|-----------------|----------|
| **Hybride omv.** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **PV omv.**     | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Standaard Modbus-adressen

| Apparaat | Adres |
|---------|-------|
| Installatie (lezen/schrijven) | **247** |
| Installatie broadcast (schrijven, geen antwoord) | **0** |
| Omvormer | **1** |
| AC-oplader (EVAC) | **2** |

---

## Installatie

### Via ioBroker Admin (aanbevolen)
1. Open ioBroker Admin → Adapter
2. Zoek naar „sigenergy"
3. Installeren

---

## Configuratie

### Tabblad Verbinding
- **Verbindingstype**: TCP (Ethernet) of Serieel (RS485)
- **TCP-host**: IP-adres van de omvormer
- **TCP-poort**: 502 (standaard)
- **Installatie Modbus ID**: 247 (standaard)
- **Omvormer Modbus ID**: 1 (standaard)

### Tabblad Componenten
Selecteer welke apparaten zijn geïnstalleerd:
- Batterij / ESS
- PV-panelen
- AC-oplader (EVAC)
- DC-oplader

### Tabblad Statistieken
Kies welke statistische waarden berekend moeten worden:
- Tijd tot volledig opladen batterij
- Resterende batterijduur
- Dagelijkse oplaadtijd
- Batterijdekkingstijd
- Eigenverbruiksgraad
- Autarkiegraad

---

## Gegevensobjecten

### Installatie (`plant.*`)
| Status | Beschrijving | Eenheid |
|--------|-------------|---------|
| `plant.gridActivePower` | Netvermogen (>0 afname, <0 teruglevering) | kW |
| `plant.pvPower` | PV-opwekking | kW |
| `plant.essPower` | Batterijvermogen (<0 ontlading) | kW |
| `plant.essSoc` | Batterijlaadtoestand | % |
| `plant.activePower` | Totaal actief vermogen installatie | kW |
| `plant.runningState` | Installatiestatus (0=Standby, 1=Actief...) | - |

### Omvormer (`inverter.*`)
| Status | Beschrijving | Eenheid |
|--------|-------------|---------|
| `inverter.pvPower` | PV-vermogen bij omvormer | kW |
| `inverter.essBatterySoc` | Batterij SOC | % |
| `inverter.essBatterySoh` | Batterij SOH | % |
| `inverter.essBatteryTemperature` | Batterijtemperatuur | °C |
| `inverter.phaseAVoltage` | Fase A spanning | V |
| `inverter.gridFrequency` | Netfrequentie | Hz |

### Statistieken (`statistics.*`)
| Status | Beschrijving | Eenheid |
|--------|-------------|---------|
| `statistics.batteryTimeToFull` | Minuten tot batterij vol | min |
| `statistics.batteryTimeRemaining` | Resterende batterijduur | min |
| `statistics.selfConsumptionRate` | Eigenverbruiksgraad | % |
| `statistics.autarkyRate` | Autarkiegraad | % |
| `statistics.housePower` | Berekend huisverbruik | kW |

---

## VIS-widgets

> **Let op:** Alle 7 widgets worden geleverd door de afzonderlijke adapter [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy). Installeer deze adapter naast deze adapter om de widgets in VIS-2 te gebruiken.

### Energiestroom-widget
Toont geanimeerde energiestroom tussen PV → Batterij ↔ Net → Huis.

### Batteriistatus-widget
Toont SOC-balk, SOH-badge, tijd tot vol/leeg, huidig vermogen.

### Vermogensoverzicht-widget
Live weergave van alle vier vermogensstromen.

### Statistieken-widget
Huidig autarkieniveau, eigenverbruik, SOC min/max, batterijdekkingstijd.

### Omvormer-widget
Live omvormergegevens: PV-vermogen, netfrequentie, fasespanningen, temperatuur.

### AC-oplader-widget (EVAC)
Status en vermogensmetingen van het Sigen EVAC-laadstation.

### DC-oplader-widget
Status en vermogensmetingen van de DC-oplader.

---

## Communicatieprotocol

- Modbus TCP: TCP-modus, volleduplex, poort 502 (slave)
- Modbus RTU: halfduplex, 9600 bps, 8N1
- Minimaal pollinterval: 1000 ms (1 seconde) per Sigenergy-specificatie
- Time-out: 1000 ms per Sigenergy-specificatie

---

## Changelog

### 1.9.14 (2026-05-27)
- (ssbingo) Fix: CI-pipeline-correcties — Node.js 24, @types/node ^22.0.0, package-lock.json gecorrigeerd; alleen nieuwste vermelding in common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Fix: package-lock.json bijgewerkt voor @types/node ^22.0.0 (was vergrendeld op 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) Fix: @types/node vastgezet op ^22.0.0 in devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) Fix: Node.js 24 voor CI-jobs check-and-lint en deploy
- (ssbingo) Chore: @types/node toegevoegd als devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Dependency-updates via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) CI-updates — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Dependency-updates via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Vereist nu Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) Fix: gedupliceerde connectie-/poll-foutlogs voorkomen log-flooding en verbeteren Sentry-gereedheid
- (ssbingo) Fix: shutdown-guards en extendForeignObject voorkomen race-condities bij unload en met de admin UI
- (ssbingo) Fix: socket-lek bij Modbus-timeout verholpen; testConnection pauzeert nu het polling; lege control-channels verwijderd

### 1.9.7 (2026-04-16)
- (ssbingo) Nieuw: berekende states plant.pv1Power, plant.pv2Power, plant.pv3Power toegevoegd


### 1.9.6 (2026-04-16)
- (ssbingo) Nieuw: berekende states plant.pv1Power, plant.pv2Power, plant.pv3Power toegevoegd


### 1.9.5 (2026-04-08)
- (ssbingo) Fix: ongebruikt common.schedule verwijderd uit io-package.json

### 1.9.4 (2026-04-08)
- (ssbingo) Fix: Changelog / CHANGELOG_OLD.md toegevoegd

### 1.9.3 (2026-04-08)
- (ssbingo) Bugfix: admin/index.html verwijderd

### 1.9.2 (2026-04-08)
- (ssbingo) Bugfixes

### 1.9.1 (2026-04-08)
- (ssbingo) Admin-UI gecorrigeerd: verouderde bestanden index.html/index_m.html/words.js verwijderd; jsonData-type in jsonConfig sendTo-knoppen gecorrigeerd

### 1.9.0 (2026-03-26)
- (ssbingo) Test voltooid

### 1.8.23 (2026-03-26)
- (ssbingo) Copyrighljaar gecorrigeerd naar 2026 in LICENSE en README; technische correcties: CI/CD, linting, tests

