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
### 1.8.20 (2026-03-26)
* 4 resterende prettier-fouten gecorrigeerd: haakjes scanner.js, extra lege regel main.js, setTimeout-omloop, string-vervolg-inspringing

### 1.8.19 (2026-03-26)
* Alle JS-bestanden geconverteerd van tabs naar 4 spaties conform standaard @iobroker/eslint-config; pijlfunctie-haakjes gecorrigeerd

### 1.8.18 (2026-03-26)
* Standaard ioBroker linter-setup: eslint.config.mjs en prettier.config.mjs vereenvoudigd, delegeren volledig aan @iobroker/eslint-config

### 1.8.17 (2026-03-26)
* Standaard ioBroker-tests hersteld: aangepaste placeholders vervangen door tests.unit() en tests.integration() uit @iobroker/testing

### 1.8.16 (2026-03-26)
* setInterval polling vervangen door setTimeout-lus om overlappende poll-cycli te voorkomen; pollInterval begrensd tot [5 000…300 000 ms]

### 1.8.15 (2026-03-26)
* Alle native timers vervangen door adapter-wrappers; adapter-timers via constructor geïnjecteerd in lib/modbus.js en lib/scanner.js

### 1.8.15 (2026-03-26)
* Native timers vervangen door adapter-wrappermethoden (this.setTimeout etc.) om annulering bij unload te garanderen

### 1.8.14 (2026-03-26)
* Ongebruikte onStateChange-handler verwijderd (adapter reageert niet op statuswijzigingen)

### 1.8.13 (2026-03-26)
* util._extend patcher verwijderd (workaround voor http-proxy dat geen dependency is van deze adapter)

### 1.8.12 (2026-03-26)
* serialport verplaatst naar dependencies (W5042); eslint/@eslint/js verwijderd uit devDependencies; verouderde admin/index.html en admin/words.js verwijderd

### 1.8.11 (2026-03-26)
* Prefix 'node:util' gebruikt voor ingebouwd Node.js-module (S5043)

### 1.8.10 (2026-03-26)
* LICENSE-sectie verplaatst naar einde README.md (na Changelog); volledige MIT-licentietekst toegevoegd; LICENSE-bestand toegevoegd aan repository-root

### 1.8.9 (2026-03-18)
* Update Dependencies modbus-serial -> 8.0.25

### 1.8.8 (2026-03-18)
* Sectie ## Installation verwijderd uit README.md (S6014); standaard ioBroker-installatie via Admin

### 1.8.7 (2026-03-18)
* npm-token verwijderd uit workflow (W3019); Trusted Publishing gebruikt voor npm-releases

### 1.8.6 (2026-03-18)
* npm-token toegevoegd aan test-and-release.yml voor npm-publicatie

### 1.8.5 (2026-03-18)
* npm-token toegevoegd aan test-and-release.yml workflow voor npm-publicatie

### 1.8.4 (2026-03-16)
* Uitgebreide debug-logging: configuratie bij start, FC03/FC04 verzoeken en antwoorden, gedecodeerde state-waarden, poll-tijden per component

### 1.8.3 (2026-03-16)
* adminTab-navigatie-item verwijderd; alle configuratie inclusief SigenMicro-scan blijft in het instantie-configuratiedialoog

### 1.8.2 (2026-03-16)
* Mappen test/unit en test/integration aangemaakt; CI-fout opgelost

### 1.8.1 (2026-03-16)
* Scripts test:unit en test:integration toegevoegd aan package.json

### 1.8.0 (2026-03-16)
* Alle resterende lint-fouten gecorrigeerd: qty-inspringing, arrow-haakjes, ternaire regelafbreking

### 1.7.9 (2026-03-16)
* Alle resterende prettier/eslint-fouten gecorrigeerd: regels >120 tekens, arrow-haakjes

### 1.7.8 (2026-03-16)
* Resterende ESLint-fouten gecorrigeerd: arrow-haakjes, regelafbreking, sendTo-opmaak, mocha-globals

### 1.7.8 (2026-03-16)
* Resterende ESLint-fouten gecorrigeerd: haakjes om arrow-functies met één param; eslint.config.mjs opgemaakt; mocha globals; prettier.config.mjs

### 1.7.7 (2026-03-16)
* Alle ESLint-fouten gecorrigeerd: spaties naar tabs, accolades na if, ongebruikte variabelen, lege catch-blokken, JSDoc

### 1.7.6 (2026-03-16)
* W5022 opgelost: words.js geleegd; i18n-bestanden gemigreerd naar plat LANG.json

### 1.7.5 (2026-03-16)
* i18n:true met admin/i18n/-bestanden hersteld (W5022-naleving); inline meertalige objecten teruggedraaid naar string-sleutels

### 1.7.5 (2026-03-16)
* fixed

### 1.7.4 (2026-03-16)
* Vertalingen gecorrigeerd: i18n:true vervangen door inline meertalige label-objecten in jsonConfig.json en sigenmicro-tab.json

### 1.7.3 (2026-03-16)
* i18n in sigenmicro-tab.json gecorrigeerd: type gewijzigd van panel naar tabs zodat Admin 7 i18n:true respecteert

### 1.7.2 (2026-03-16)
* Taaldetectie gecorrigeerd: words.js herbouwd met 97 i18n-sleutels; class=translate toegevoegd

### 1.7.1 (2026-03-16)
* i18n-vertalingen toegevoegd voor alle SigenMicro-beheerteksten (21 nieuwe sleutels)

### 1.7.0 (2026-03-16)
* HTML-iframe vervangen door native jsonConfig-tab; type:state toont live scanvoortgang zonder custom JS

### 1.6.3 (2026-03-16)
* Scan voortgang: alle CSS-var-afhankelijke elementen vervangen door altijd zichtbare logbox met vaste kleuren

### 1.6.2 (2026-03-16)
* Scan: bewezen chunked sendTo hersteld (3 IDs per aanroep); dubbele voortgang: tekst per chunk + getState van info.scanProgress

### 1.6.1 (2026-03-16)
* Scan voortgang: subscribeState vervangen door setInterval+getState (500ms); veiligheidstimer 2s per ID

### 1.6.0 (2026-03-16)
* Scan voortgang: State subscription (info.scanProgress) i.p.v. sendTo chunks; adapter schrijft voortgang per ID

### 1.5.6 (2026-03-16)
* Onzichtbare voortgangsbalk vervangen door tekstregel met percentage en ID-bereik

### 1.5.5 (2026-03-16)
* SigenMicro scan hersteld: bestaande Modbus-verbinding hergebruiken; polling pauzeren; dubbele scanstart gecorrigeerd

### 1.5.4 (2026-03-16)
* SigenMicro voortgang: CSS-klassen vervangen door element.style.display; probe timeout 1000ms; chunk grootte 3

### 1.5.3 (2026-03-16)
* SigenMicro scan voortgang: CSS max-height transitie + shimmer animatie (geen display:none conflicten); requestAnimationFrame voor betrouwbare hertekening

### 1.5.2 (2026-03-16)
* SigenMicro tab: voortgangsbalk zichtbaar; gereserveerde IDs worden getoond en overgeslagen; melding als geen apparaten gevonden

### 1.5.1 (2026-03-16)
* Scan-knop voor SigenMicro direct toegevoegd aan de jsonConfig-tab; gevonden apparaten worden automatisch opgeslagen

### 1.5.0 (2026-03-16)
* SigenMicro-tab: prominente scanknop, realtime voortgangsbalk met huidig ID-bereik en live apparaattelling

### 1.4.1 (2026-03-16)
* SigenMicro ondersteuning: Modbus-scan, apparaatdetectie, per apparaat in-/uitschakelen, eigen beheertab

### 1.4.0 (2026-03-14)
* Fixes / Opschoning

### 1.3.19 (2026-03-14)
* eslint/@eslint/js teruggedraaid naar 9.x; serialport bijgewerkt naar 13.0.0

### 1.3.18 (2026-03-14)
* eslint 10.0.3, @eslint/js 10.0.1, serialport 13.0.0 bijgewerkt

### 1.3.17 (2026-03-13)
* Mocha verwijderd uit devDependencies

### 1.3.16 (2026-03-13)
* Mocha devDependency hersteld, test:package script gecorrigeerd

### 1.3.15 (2026-03-13)
* Inspringing setTimeout in testConnection gecorrigeerd

### 1.3.14 (2026-03-13)
* Laatste twee lint-fouten opgelost

### 1.3.13 (2026-03-13)
* Alle ESLint/Prettier-fouten opgelost: JSDoc, opmaak, ongebruikte imports

### 1.3.12 (2026-03-13)
* Curly-regressie opgelost in modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Prettier-fix: ontbrekende afsluitende komma's in registers.js

### 1.3.10 (2026-03-13)
* Prettier-fix: inline registerobjecten uitgebreid naar meerdere regels

### 1.3.9 (2026-03-13)
* Documentatie toegevoegd in README.md - meertalig

### 1.3.8 (2026-03-13)
* Ontbrekende uk/zh-cn vertalingen toegevoegd

### 1.3.7 (2026-03-13)
* Overbodige mocha devDependency verwijderd

### 1.3.6 (2026-03-13)
* Prettier/ESLint-opmaak gecorrigeerd

### 1.3.5 (2026-03-13)
* (ssbingo) CI-fix: expliciet mocha-binair pad gebruiken om PATH-resolutieproblemen met npm ci te vermijden

### 1.3.4 (2026-03-13)
* (ssbingo) CI-fix: mocha toegevoegd aan devDependencies zodat het test:package-script kan worden uitgevoerd

### 1.3.3 (2026-03-13)
* (ssbingo) Dubbele @param JSDoc-waarschuwing verholpen door ontbrekend sluitend label in modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Codekwaliteitsverbeteringen: ongebruikte variabelen verwijderd, JSDoc-documentatie voltooid, lexicale declaratie in switch-case gecorrigeerd

### 1.3.0 (2026-03-13)
* (ssbingo) Meertalige documentatie bijgewerkt

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
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)

## License
MIT License

Copyright (c) 2025 ssbingo <s.sternitzke@online.de>

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
