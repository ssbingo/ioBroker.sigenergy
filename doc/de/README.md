# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter für Sigenergy Solarenergieanlagen via Modbus TCP/RTU**

Unterstützt das Sigenergy Modbus Protokoll V2.9 (veröffentlicht 2026-05-13).

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

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

## Notabschaltung — Schutz externer PV-Systeme

### Hintergrund

Sigenergy-Hybridwechselrichter verfügen über ein optionales **Notstromgateway**,
das bei einem Netzausfall automatisch in den Off-Grid- / Inselbetrieb wechselt.
In diesem Modus erzeugt das Sigenergy-System ein eigenes lokales AC-Netz,
das aus der Batterie gespeist wird.

Wenn ein **zweites PV-System** — etwa ein Balkonkraftwerk, ein Mikrowechselrichter
oder ein Fremd-Stringwechselrichter — am selben Hausstromkreis angeschlossen ist,
speist es weiterhin in dieses isolierte Netz ein. Die meisten netzgekoppelten
Wechselrichter sind nicht für diesen Betrieb ausgelegt und können:

- das Batterie-Management des Sigenergy-Systems überlasten
- Spannung oder Frequenz im Inselnetz destabilisieren
- durch die ungewöhnlichen Betriebsbedingungen beschädigt werden

Die einzig sichere Lösung ist die **sofortige Trennung** des externen Systems,
sobald Sigenergy in den Off-Grid-Modus wechselt.

### Funktionsweise im Adapter

Der Adapter überwacht den State `plant.onOffGridStatus` in jedem Poll-Zyklus.

**Bei Netzausfall** (`onOffGridStatus` = 1 oder 2):
- Alle konfigurierten Notabschalt-Geräte werden sofort geschaltet
- Optional wird eine Telegram-Benachrichtigung gesendet

**Bei Netzzurückkehr** (`onOffGridStatus` = 0):
- Ein konfigurierbarer Stabilisierungs-Timer startet (Standard: 10 Minuten)
- Ist das Netz nach Ablauf des Timers noch stabil, werden die Geräte zurückgeschaltet
- Fällt das Netz während des Timers erneut aus, wird der Timer verworfen
  und die Geräte bleiben im Abschaltzustand
- Bei erfolgreicher Wiedereinschaltung wird optional eine Telegram-Meldung gesendet

### Funktion aktivieren

**Schritt 1 — Tab Komponenten**  
Checkbox **Notstrom-Gateway (Off-Grid-Schaltung)** aktivieren.  
Der Tab *Notabschaltung* wird sichtbar.

**Schritt 2 — Tab Notabschaltung**

#### Geräte

| Feld | Beschreibung |
|---|---|
| **Stabilisierungszeit (Minuten)** | Wie lange das Netz nach der Rückkehr stabil sein muss, bevor die Geräte wieder eingeschaltet werden. Empfehlung: 10 Minuten. |
| **Gerät 1 — Objekt-ID** | ioBroker-State-ID des Hauptschalters des externen Systems. Bei Netzausfall wird `false` gesetzt, nach stabiler Erholung `true`. |
| **Geräte 2–4 — Objekt-ID** | Weitere optionale Geräte. |
| **Geräte 2–4 — Schaltrichtung** | *AUS bei Ausfall, EIN nach Erholung* oder *EIN bei Ausfall, AUS nach Erholung*. |

#### Telegram-Benachrichtigung (optional)

| Feld | Beschreibung |
|---|---|
| **Telegram-Benachrichtigung aktivieren** | Schaltet Meldungen bei Netzausfall und Netzerholung ein. |
| **Telegram-Instanz** | Die zu verwendende `telegram.x`-Adapterinstanz. |
| **Chat-ID** | Optional: Einschränkung auf einen bestimmten Chat. Leer lassen für Broadcast. |

### Beispiel — Balkonkraftwerk

Ein Shelly Plus 1 ist in die Zuleitung des Balkonkraftwerks eingeschleift.
Seine ioBroker-State-ID lautet `shelly.0.SHPLUS1-ABC123.Relay0.Switch`.

Konfiguration:
- **Gerät 1**: `shelly.0.SHPLUS1-ABC123.Relay0.Switch`  
  → Relais öffnet (`false`) bei Netzausfall, schließt (`true`) nach stabiler Erholung

Das Balkonkraftwerk ist damit automatisch geschützt.

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

### 3.0.6 (2026-06-14)
- (ssbingo) fix: doppeltes common.license-Feld entfernt — licenseInformation bereits vorhanden

### 3.0.5 (2026-06-14)
- (ssbingo) fix: fehlendes license-Feld im common-Block der io-package.json ergänzt

### 3.0.4 (2026-06-14)
- (ssbingo) Fix: Telegram-Benachrichtigung bei Netzausfall wird nur noch einmal gesendet (nicht bei jedem Poll); Schaltvorgang auf maximal 3 Versuche begrenzt (initial + 2 Wiederholungen) solange Off-Grid

### 3.0.3 (2026-06-13)
- (ssbingo) Fix: nicht-funktionalen welcomeText aus io-package.json entfernt; sichtbarer Warnhinweis als staticText im Tab Notabschaltung ergänzt (gelbe Box, i18n in allen 11 Sprachen)

### 3.0.2 (2026-06-13)
- (ssbingo) Fix: ESLint/Prettier-Fehler in den Notabschalt-Methoden behoben — ungenutzte Variable entfernt, Einrückung korrigiert, JSDoc @param-Typen ergänzt

### 3.0.1 (2026-06-13)
- (ssbingo) Neu: welcomeText in io-package.json ergänzt — mehrsprachiger Hinweis zur Notabschalt-Funktion

### 3.0.0 (2026-06-13)
- (ssbingo) Neu: Notabschaltung — automatische Trennung externer PV-Systeme (Balkonkraftwerke, Mikrowechselrichter) bei Netzausfall; konfigurierbarer Stabilisierungs-Timer nach Netzzurückkehr; optionale Telegram-Benachrichtigungen
- (ssbingo) Docs: Dokumentation der Notabschaltung in allen 11 Sprachen ergänzt

### 2.5.2 (2026-06-12)
- (ssbingo) fix: Leerzeichen in der Buy-me-a-Coffee-Button-URL als %20 kodiert — Bild wurde auf GitHub nicht angezeigt

### 2.5.1 (2026-06-12)
- (ssbingo) fix: Rolle des instanceObjects info.modelType von 'info.name' auf 'text' korrigiert (W1133/W1135 Adapter-Checker-Warnungen)

### 2.5.0 (2026-06-12)

- (ssbingo) Architektonische Schreibsicherheit: Modbus-Writes werden direkt im Write-Dispatcher abgelehnt, wenn das Zielregister für den konfigurierten Gerätetyp ungültig ist (models-Gating in onStateChange, Plant-Guard für Nur-SigenMicro)
- (ssbingo) TypeScript-Check repariert — neue `lib/adapter-config.d.ts` mit vollständiger AdapterConfig-Deklaration, typisierter modbus-serial-Konstruktor, ioBroker.CommonType/SettableObject-Annotationen; neues Script `npm run check` läuft mit 0 Fehlern
- (ssbingo) ESLint-Konfiguration erlaubt JSDoc-`@type`-Tags in diesem geprüften JavaScript-Projekt (jsdoc/check-tag-names mit typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Gerätetyp-Architektur: Pflicht-Selektor (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / reiner PV-Wechselrichter / nur SigenMicro) mit striktem Entweder/Oder-Registergating gemäß den Modell-Fußnoten von Protokoll V2.9
- (ssbingo) Sigen Hybrid und reine PV-Wechselrichter (Sigen PV / PV Max) offiziell unterstützt
- (ssbingo) Automatische Gerätetyperkennung aus der Hardware im Admin (Register 30500 / 31024)
- (ssbingo) Modellverifikation beim Start — warnt bei Abweichung zwischen Konfiguration und erkannter Hardware (neuer Datenpunkt info.modelType)
- (ssbingo) Dynamische PV-String-Register: PV5-PV16 Spannung/Strom über die in Register 31025 gemeldete String-Anzahl
- (ssbingo) PCC-Leistungsfaktor-Steuerung (40157/40158) nur für Sigen PV M1-HYB; ESS Preheating nur M1-HYB; DC-Charger und Grid Code nur SigenStor/Sigen Hybrid
- (ssbingo) Automatische Migration von Konfigurationen vor 2.4.0 und Bereinigung von Channels, die für den gewählten Gerätetyp ungültig sind

### 2.3.4 (2026-06-12)
- (ssbingo) fix: Protokollversionserkennung korrigiert — korrekte Registermengen für Probes, absteigende Reihenfolge V2.9→V2.6, Transportfehler von Geräteantworten unterschieden um fehlerhafte pre-V2.6-Meldung zu vermeiden

### 2.3.3 (2026-06-11)
- (ssbingo) fix: wiederholte Register-Lesewarnungen nach erstem Auftreten für plant/inverter/acCharger/dcCharger/pss/pid unterdrückt; weitere Fehler nur noch auf Debug-Ebene

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
