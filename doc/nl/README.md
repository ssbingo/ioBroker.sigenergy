# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter voor Sigenergy zonne-energiesystemen via Modbus TCP/RTU**

Ondersteunt het Sigenergy Modbus Protocol V2.9 (uitgebracht 2026-05-13).

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

---

## Functies

- 📡 **Modbus TCP** (Ethernet / WLAN / glasvezel / 4G) — poort 502
- 🔗 **Modbus RTU** (RS485 serieel)
- ⚡ **Volledige registerondersteuning** — alle installatie-, omvormer-, PSS- en PID-registers per V2.9-specificatie
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
- PSS (vermogensschakelaar)
- PID (PV-isolatiebewaking)
- ESS-voorverwarming (alleen M1-HYA/HYB)
- SigenMicro (micro-omvormers)

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

### 2.5.2 (2026-06-12)
- (ssbingo) fix: spaties in de Buy Me a Coffee-knop-URL gecodeerd als %20 — afbeelding werd niet weergegeven op GitHub

### 2.5.1 (2026-06-12)
- (ssbingo) fix: rol van instanceObject info.modelType gecorrigeerd van 'info.name' naar 'text' (W1133/W1135 adapter-checker-waarschuwingen)

### 2.5.0 (2026-06-12)

- (ssbingo) Architecturale schrijfveiligheid: Modbus-schrijfopdrachten worden direct in de write-dispatcher geweigerd als het doelregister ongeldig is voor het geconfigureerde apparaattype (models-gating in onStateChange, plant-guard voor alleen-SigenMicro)
- (ssbingo) TypeScript-controle gerepareerd — nieuwe `lib/adapter-config.d.ts` met volledige AdapterConfig-declaratie, getypeerde modbus-serial-constructor, ioBroker.CommonType/SettableObject-annotaties; nieuw script `npm run check` slaagt met 0 fouten
- (ssbingo) ESLint-configuratie staat JSDoc `@type`-tags toe in dit gecontroleerde JavaScript-project (jsdoc/check-tag-names met typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Apparaattype-architectuur: verplichte selector (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / alleen PV-omvormer / alleen SigenMicro) met strikte of/of-registerafscherming volgens de modelvoetnoten van protocol V2.9
- (ssbingo) Sigen Hybrid en alleen-PV-omvormers (Sigen PV / PV Max) officieel ondersteund
- (ssbingo) Automatische detectie van het apparaattype vanuit de hardware in de admin (registers 30500 / 31024)
- (ssbingo) Modelverificatie bij het opstarten — waarschuwt bij afwijking tussen configuratie en hardware (nieuwe state info.modelType)
- (ssbingo) Dynamische PV-stringregisters: PV5-PV16 spanning/stroom via het stringaantal uit register 31025
- (ssbingo) PCC-arbeidsfactorregeling (40157/40158) alleen voor M1-HYB; ESS-voorverwarming alleen M1-HYB; DC-lader en grid code alleen SigenStor/Sigen Hybrid
- (ssbingo) Automatische migratie van configuraties vóór 2.4.0 en opschoning van kanalen die ongeldig zijn voor het gekozen apparaattype

### 2.3.4 (2026-06-12)
- (ssbingo) fix: correcte protocolniveaudetectie — juiste registerhoeveelheden voor probes, aflopende volgorde V2.9→V2.6, onderscheid transportfouten van apparaatreacties om vals pre-V2.6-rapport te voorkomen

### 2.3.3 (2026-06-11)
- (ssbingo) fix: herhaalde register-leeswaarschuwingen na eerste voorkomen onderdrukken voor plant/inverter/acCharger/dcCharger/pss/pid; volgende fouten alleen op debug-niveau gelogd

### 2.3.2 (2026-06-10)
- (ssbingo) fix: 'pre-V2.6' tonen in plaats van 'unknown' als het apparaat reageert maar geen uitgebreide plant-registers heeft; debug-log per probe met Modbus-uitzonderingsmelding

### 2.3.1 (2026-06-10)
- (ssbingo) feat: Modbus-protocolniveau bij opstarten detecteren door registers 30088/30200/30228/30286 te sonderen; firmwareversie (30525) lezen; resultaat loggen en opslaan als info.protocolLevel-state

### 2.3.0 (2026-06-10)
- (ssbingo) feat: common.states enum-maps toegevoegd voor emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState; PSS/PID/AC Charger schrijfregisters (FC06/FC10) gekoppeld met subscribe en onStateChange-handlers

### 2.2.7 (2026-06-10)
- (ssbingo) Fix: ontbrekende native-standaarden enableSmartLoads/enableCumulativeEnergy/enableGridCode toegevoegd aan io-package.json
- (ssbingo) Fix: beschrijving register 30003 bijgewerkt met V2.7 EMS-modi 5 (FullFeedIn) en 9 (Custom)

### 2.2.6 (2026-06-10)
- (ssbingo) Nieuw: V2.9 register-audit — ontbrekend register 30279 toegevoegd, DC Charger PV-registers 31509/31511 verplaatst naar dcCharger-namespace, ESS-voorverwarmings-TOU-gain gecorrigeerd
- (ssbingo) Nieuw: terugschrijven van besturingsregisters voor plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); RW-registers gelezen bij opstarten
- (ssbingo) Fix: herhaalde ESS-voorverwarmingswaarschuwingen onderdrukt; opstartleesfouten van besturingsregisters teruggebracht naar debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: ESS-voorverwarming TOU polling (FC03, 50000–50183) en terugschrijven geïmplementeerd; encodeValue toegevoegd

### 2.2.3 (2026-06-10)
- (ssbingo) fix: 25 ontbrekende i18n-sleutels toegevoegd (PSS, PID, ESS-voorverwarming, uitgebreide registers) in alle 11 talen

### 2.2.2 (2026-06-09)
- (ssbingo) docs: alle READMEs bijgewerkt naar Modbus Protocol V2.9 — PSS, PID, ESS-voorverwarming, uitgebreide registers, SigenMicro toegevoegd

### 2.2.1 (2026-06-09)
- (ssbingo) fix: PSS-registertabel gecorrigeerd naar 122 vermeldingen per officiële spec V2.9 (adressen, gains, types); PSS-schrijfregisters gecorrigeerd naar 6 WO-vermeldingen; PID-registers 33055-33060 gecorrigeerd (types, gains, 2 ontbrekende vermeldingen)

### 2.2.0 (2026-06-09)
- (ssbingo) Functie: ondersteuning PSS (vermogensschakelaar) en PID (PV-isolatiebewaking); ESS-voorverwarmingsregeling TOU-schema-registers; nieuwe admin-opties voor PSS/PID-slave-ID's

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Functie: uitgebreide statistieken — installatiestatistieken (30088–30097), slimme belastingen 1–24 (30098–30193), gecumuleerde energie (30194–30271), regelingsfeedback (30613–30619), netcodeparameters (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Functie: Modbus-protocol V2.9 — nieuwe registers voor installatie/omvormer/DC-lader, verouderde registers verwijderd, enumeraties uitgebreid

### 1.9.17 (2026-06-08)
- (ssbingo) Fix: dubbel i18n-lang formaat verwijderd (admin/i18n), vertaalsleutel /dev/ttyUSB0 toegevoegd

### 1.9.16 (2026-06-08)
- (ssbingo) Chore: devDependency @alcalzone/release-script bijgewerkt naar ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) Chore: @tsconfig/node22 toegevoegd als devDependency (ioBroker template-update)
- (ssbingo) Chore: testing-action-check bijgewerkt naar @v2
- (ssbingo) Chore: axios beveiligingsupdate

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
