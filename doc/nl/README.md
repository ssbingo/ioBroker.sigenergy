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

## Licentie

MIT-licentie — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.2.5 (2026-03-12)
* (ssbingo) Bugfixes

### 1.2.4 (2026-03-12)
* (ssbingo) Meertalige documentatie toegevoegd aan README.md

### 1.2.3 (2026-03-12)
* (ssbingo) Bugfixes voor AdapterCheck

### 1.2.2 (2026-03-11)
* (ssbingo) Bugfixes

### 1.2.1 (2026-03-11)
* (ssbingo) Bugfixes

### 1.2.0 (2026-03-11)
* (ssbingo) StatisticsCalculator bijgewerkt: batterij-tijdschattingen, dagelijkse oplaadtijd en batterijdekking-tracking teruggevoegd

### 1.1.9 (2026-03-11)
* (ssbingo) StatisticsCalculator vervangen door verbeterde versie: vloeiend huisvermogen, gecorrigeerde formules voor autarkie/eigenverbruik

### 1.1.8 (2026-03-11)
* (ssbingo) Auteursinformatie gecorrigeerd in package.json; nieuwsvermeldingen opgeschoond in io-package.json

### 1.1.7 (2026-03-11)
* (ssbingo) Verbeterde logging: debug/info/warn/error berichten voor verbindingslevenscyclus, pollcycli, registerleesacties en adapter-afsluiting

### 1.1.0 (2026-03-09)
* (ssbingo) Admin UI gemigreerd van legacy HTML naar jsonConfig (Admin 5+)

### 0.1.0 (2026-03-01)
* (ssbingo) Eerste release — Modbus TCP/RTU-ondersteuning voor Sigenergy-systemen

---

## Documentatie

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
