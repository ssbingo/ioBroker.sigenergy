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

## Nooduitschakeling — bescherming van externe PV-systemen

### Achtergrond

Sigenergy hybride omvormers beschikken over een optionele **noodstroom-gateway**
die bij een netuitval automatisch overschakelt naar off-grid / eilandbedrijf.
In deze modus genereert het Sigenergy-systeem een eigen lokaal wisselstroomnet
dat gevoed wordt door de batterij.

Als er een **tweede PV-systeem** — zoals een balkon-zonnecentrale, een micro-omvormer
of een externe string-omvormer — op hetzelfde huishoudelijke circuit is aangesloten,
blijft het energie leveren aan dit geïsoleerde lokale net. De meeste netgekoppelde
omvormers zijn niet ontworpen voor deze situatie en kunnen:

- het batterijbeheersysteem van Sigenergy overbelasten
- spanning of frequentie in het eilandnet destabiliseren
- beschadigd raken door de ongewone bedrijfsomstandigheden

De enige veilige oplossing is het **onmiddellijk loskoppelen** van het externe systeem
zodra Sigenergy naar off-grid modus schakelt.

### Hoe de adapter dit afhandelt

De adapter bewaakt de toestand `plant.onOffGridStatus` bij elke poll-cyclus.

**Bij netuitval** (`onOffGridStatus` = 1 of 2):
- Alle geconfigureerde noodapparaten worden direct geschakeld
- Optioneel wordt een Telegram-melding verstuurd

**Bij terugkeer van het net** (`onOffGridStatus` = 0):
- Een instelbare stabilisatietimer start (standaard: 10 minuten)
- Als het net gedurende de volledige periode stabiel blijft, worden de apparaten hersteld
- Als het net tijdens de timer opnieuw uitvalt, wordt de timer verworpen en blijven de apparaten uitgeschakeld
- Bij succesvolle herstart wordt optioneel een Telegram-melding verstuurd

### Functie activeren

**Stap 1 — tabblad Componenten**  
Vink **Noodstroom-gateway (off-grid schakeling)** aan.  
Het tabblad *Nooduitschakeling* wordt zichtbaar.

**Stap 2 — tabblad Nooduitschakeling**

#### Apparaten

| Veld | Beschrijving |
|---|---|
| **Stabilisatietijd (minuten)** | Hoe lang het net stabiel moet blijven voordat apparaten teruggeschakeld worden. Aanbeveling: 10 minuten. |
| **Apparaat 1 — Object-ID** | De ioBroker-toestand-ID van de hoofdschakelaar van het externe systeem. Bij netuitval ingesteld op `false`; na stabiel herstel op `true`. |
| **Apparaten 2–4 — Object-ID** | Extra optionele apparaten. |
| **Apparaten 2–4 — Schakelrichting** | *UIT bij uitval, AAN na herstel* of *AAN bij uitval, UIT na herstel*. |

#### Telegram-meldingen (optioneel)

| Veld | Beschrijving |
|---|---|
| **Telegram-melding inschakelen** | Activeert meldingen bij netuitval en herstel. |
| **Telegram-instantie** | Selecteer de te gebruiken `telegram.x`-adapterinstantie. |
| **Chat-ID** | Optioneel: beperk tot een specifieke chat. Leeg laten voor broadcast. |

### Voorbeeld — balkon-zonnecentrale

Een Shelly Plus 1 relais is in serie geschakeld met de voedingskabel van de balkon-zonnecentrale.
De ioBroker-toestand-ID is `shelly.0.SHPLUS1-ABC123.Relay0.Switch`.

Configuratie:
- **Apparaat 1**: `shelly.0.SHPLUS1-ABC123.Relay0.Switch`  
  → Relais opent (`false`) bij netuitval, sluit (`true`) na stabiel herstel

De balkon-zonnecentrale is nu automatisch beschermd.

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

### 3.0.8 (2026-06-29)
- (ssbingo) fix: ontbrekende i18n-vertalingen toegevoegd voor SigenMicro-scan UI-teksten in es, fr, it, nl, pl, pt, uk, zh-cn

### 3.0.7 (2026-06-28)
- (ssbingo) chore: afhankelijkheden bijgewerkt (@iobroker/adapter-core 3.4.1, @types/node 22.20.0, testing-action-adapter 1.1.1, testing-action-deploy 1.5.0, http-proxy-middleware 3.0.7)

### 3.0.6 (2026-06-14)
- (ssbingo) fix: dubbel common.license-veld verwijderd — licenseInformation al aanwezig

### 3.0.5 (2026-06-14)
- (ssbingo) fix: ontbrekend license-veld toegevoegd aan common-blok van io-package.json

### 3.0.4 (2026-06-14)
- (ssbingo) Fix: Telegram-melding bij netuitval wordt nu slechts eenmaal verstuurd (niet bij elke poll); schakelhandeling beperkt tot maximaal 3 pogingen (initieel + 2 herhalingen) bij netuitval

### 3.0.3 (2026-06-13)
- (ssbingo) Fix: niet-functionele welcomeText verwijderd uit io-package.json; zichtbare waarschuwing als staticText toegevoegd in tabblad Nooduitschakeling (gele box, i18n in alle 11 talen)

### 3.0.2 (2026-06-13)
- (ssbingo) Fix: ESLint/Prettier-fouten in nooduitschakelmethoden opgelost — ongebruikte variabele verwijderd, inspringing gecorrigeerd, JSDoc @param-typen toegevoegd

### 3.0.1 (2026-06-13)
- (ssbingo) Nieuw: welcomeText toegevoegd aan io-package.json — meertalige melding over nooduitschakelfunctie

### 3.0.0 (2026-06-13)
- (ssbingo) Nieuw: nooduitschakeling — automatisch loskoppelen van externe PV-systemen (balkon-zonnecentrales, micro-omvormers) bij netuitval; instelbare stabilisatietimer bij terugkeer van het net; optionele Telegram-meldingen
- (ssbingo) Docs: documentatie nooduitschakeling toegevoegd in alle 11 talen

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
