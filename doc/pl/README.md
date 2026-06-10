# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter dla systemów energii słonecznej Sigenergy przez Modbus TCP/RTU**

Obsługuje protokół Sigenergy Modbus V2.9 (wydany 2026-05-13).

---

## Funkcje

- 📡 **Modbus TCP** (Ethernet / WLAN / światłowód / 4G) — port 502
- 🔗 **Modbus RTU** (RS485 szeregowy)
- ⚡ **Pełna obsługa rejestrów** — wszystkie rejestry instalacji, falownika, PSS i PID według specyfikacji V2.9
- 🔋 **Statystyki baterii** — czas do pełnego naładowania, czas pozostały, dzienna pokrycie
- ☀️ **Statystyki PV** — wskaźnik autokonsumpcji, wskaźnik autarkii
- 🔌 **Ładowarka AC** (Sigen EVAC) — opcjonalna
- ⚡ **Ładowarka DC** — opcjonalna
- 🏗️ **PSS** (przełącznik zasilania) — Opcjonalny, monitoring rozdzielnic SN/nN i szaf rozdzielczych
- 🔍 **PID** (wykrywanie izolacji PV) — Opcjonalny
- 🌡️ **Podgrzewanie wstępne ESS** — Harmonogram TOU, 30 konfigurowalnych okien czasowych (M1-HYA/HYB)
- 📈 **Rejestry rozszerzone** — Inteligentne obciążenia 1–24, liczniki energii, parametry kodu sieci
- ☀️ **SigenMicro** — Wsparcie mikrofalowników (automatyczne wykrywanie)
- 📊 **Wartości obliczone** — statystyki pochodne aktualizowane przy każdym cyklu odpytywania
- 🖥️ **Widżety VIS** — przepływ energii, stan baterii, panele statystyk

---

## Obsługiwany sprzęt

| Kategoria        | Modele |
|-----------------|--------|
| **Falownik hybrydowy** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **Falownik PV** | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Domyślne adresy Modbus

| Urządzenie | Adres |
|-----------|-------|
| Instalacja (odczyt/zapis) | **247** |
| Broadcast instalacji (zapis, bez odpowiedzi) | **0** |
| Falownik | **1** |
| Ładowarka AC (EVAC) | **2** |

---

## Instalacja

### Przez ioBroker Admin (zalecane)
1. Otworzyć ioBroker Admin → Adaptery
2. Wyszukać „sigenergy"
3. Zainstalować

---

## Konfiguracja

### Zakładka Połączenie
- **Typ połączenia**: TCP (Ethernet) lub Szeregowy (RS485)
- **Host TCP**: Adres IP falownika
- **Port TCP**: 502 (domyślny)
- **ID Modbus instalacji**: 247 (domyślny)
- **ID Modbus falownika**: 1 (domyślny)

### Zakładka Komponenty
Wybierz zainstalowane urządzenia:
- Bateria / ESS
- Panele PV
- Ładowarka AC (EVAC)
- Ładowarka DC
- PSS (przełącznik zasilania)
- PID (wykrywanie izolacji PV)
- Podgrzewanie wstępne ESS (tylko M1-HYA/HYB)
- SigenMicro (mikrofalowniki)

### Zakładka Statystyki
Wybierz wartości statystyczne do obliczenia:
- Czas do pełnego naładowania baterii
- Pozostały czas baterii
- Dzienny czas ładowania
- Czas pokrycia przez baterię
- Wskaźnik autokonsumpcji
- Wskaźnik autarkii

---

## Obiekty danych

### Instalacja (`plant.*`)
| Stan | Opis | Jednostka |
|------|------|-----------|
| `plant.gridActivePower` | Moc sieci (>0 pobór, <0 oddawanie) | kW |
| `plant.pvPower` | Produkcja PV | kW |
| `plant.essPower` | Moc baterii (<0 rozładowanie) | kW |
| `plant.essSoc` | Stan naładowania baterii | % |
| `plant.activePower` | Całkowita moc czynna instalacji | kW |
| `plant.runningState` | Stan instalacji (0=Czuwanie, 1=Praca...) | - |

### Falownik (`inverter.*`)
| Stan | Opis | Jednostka |
|------|------|-----------|
| `inverter.pvPower` | Moc PV na falowniku | kW |
| `inverter.essBatterySoc` | SOC baterii | % |
| `inverter.essBatterySoh` | SOH baterii | % |
| `inverter.essBatteryTemperature` | Temperatura baterii | °C |
| `inverter.phaseAVoltage` | Napięcie fazy A | V |
| `inverter.gridFrequency` | Częstotliwość sieci | Hz |

### Statystyki (`statistics.*`)
| Stan | Opis | Jednostka |
|------|------|-----------|
| `statistics.batteryTimeToFull` | Minuty do pełnej baterii | min |
| `statistics.batteryTimeRemaining` | Pozostały czas baterii | min |
| `statistics.selfConsumptionRate` | Wskaźnik autokonsumpcji | % |
| `statistics.autarkyRate` | Wskaźnik autarkii | % |
| `statistics.housePower` | Obliczone zużycie domu | kW |

---

## Widżety VIS

> **Uwaga:** Wszystkie 7 widżetów jest dostarczanych przez oddzielny adapter [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy). Zainstaluj go razem z tym adapterem, aby korzystać z widżetów w VIS-2.

### Widżet przepływu energii
Pokazuje animowany przepływ energii między PV → Bateria ↔ Sieć → Dom.

### Widżet stanu baterii
Wyświetla pasek SOC, odznakę SOH, czas do naładowania/rozładowania, bieżącą moc.

### Widżet przeglądu mocy
Odczyt na żywo wszystkich czterech przepływów mocy.

### Widżet statystyk
Dzisiejsza autarkia, autokonsumpcja, SOC min/maks, czas pokrycia przez baterię.

### Widżet falownika
Dane falownika na żywo: moc PV, częstotliwość sieci, napięcia faz, temperatura.

### Widżet ładowarki AC (EVAC)
Stan i pomiary mocy stacji ładowania Sigen EVAC.

### Widżet ładowarki DC
Stan i pomiary mocy ładowarki DC.

---

## Protokół komunikacyjny

- Modbus TCP: tryb TCP, pełny dupleks, port 502 (slave)
- Modbus RTU: półdupleks, 9600 bps, 8N1
- Minimalny interwał odpytywania: 1000 ms (1 sekunda) według specyfikacji Sigenergy
- Timeout: 1000 ms według specyfikacji Sigenergy

---

## Changelog

### 2.2.6 (2026-06-10)
- (ssbingo) Nowe: audyt rejestrów V2.9 — dodano brakujący rejestr 30279, rejestry PV DC Charger 31509/31511 przeniesione do przestrzeni nazw dcCharger, gain TOU ESS Preheating poprawiony
- (ssbingo) Nowe: zapis powrotny rejestrów sterujących plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); rejestry RW odczytywane przy starcie
- (ssbingo) Poprawka: powtarzające się ostrzeżenia ESS Preheating wyciszone; błędy odczytu rejestrów sterujących przy starcie obniżone do debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: odczyt TOU podgrzewania ESS (FC03, 50000–50183) i zapis zaimplementowane; dodano encodeValue

### 2.2.3 (2026-06-10)
- (ssbingo) fix: dodano 25 brakujących kluczy i18n (PSS, PID, podgrzewanie ESS, rejestry rozszerzone) we wszystkich 11 językach

### 2.2.2 (2026-06-09)
- (ssbingo) docs: aktualizacja wszystkich README do protokołu Modbus V2.9 — dodano PSS, PID, podgrzewanie wstępne ESS, rejestry rozszerzone, SigenMicro

### 2.2.1 (2026-06-09)
- (ssbingo) fix: tabela rejestrów PSS poprawiona do 122 wpisów zgodnie z oficjalną specyfikacją V2.9 (adresy, wzmocnienia, typy); rejestry zapisu PSS poprawione do 6 wpisów WO; rejestry PID 33055-33060 poprawione (typy, wzmocnienia, 2 brakujące wpisy)

### 2.2.0 (2026-06-09)
- (ssbingo) Funkcja: obsługa PSS (przełącznik zasilania) i PID (wykrywanie izolacji PV); rejestry harmonogramu TOU podgrzewania wstępnego ESS; nowe opcje admin dla ID slave PSS/PID

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Funkcja: rozszerzone statystyki — statystyki instalacji (30088–30097), inteligentne obciążenia 1–24 (30098–30193), energia skumulowana (30194–30271), sprzężenie zwrotne regulacji (30613–30619), parametry kodu sieci (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Funkcja: Protokół Modbus V2.9 — nowe rejestry instalacji/falownika/ładowarki DC, usunięto przestarzałe rejestry, rozszerzono wyliczenia

### 1.9.17 (2026-06-08)
- (ssbingo) Poprawka: usunięty zduplikowany długi format i18n (admin/i18n), dodany klucz tłumaczenia /dev/ttyUSB0

### 1.9.16 (2026-06-08)
- (ssbingo) Chore: devDependency @alcalzone/release-script zaktualizowana do ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) Chore: dodano @tsconfig/node22 jako devDependency (aktualizacja szablonu ioBroker)
- (ssbingo) Chore: testing-action-check zaktualizowany do @v2
- (ssbingo) Chore: aktualizacja bezpieczeństwa axios

### 1.9.14 (2026-05-27)
- (ssbingo) Poprawka: korekty potoku CI — Node.js 24, @types/node ^22.0.0, poprawiony package-lock.json; tylko najnowszy wpis w common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Poprawka: package-lock.json zaktualizowany dla @types/node ^22.0.0 (był zablokowany na 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) Poprawka: @types/node przypięty do ^22.0.0 w devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) Poprawka: Node.js 24 dla zadań CI check-and-lint i deploy
- (ssbingo) Chore: dodano @types/node jako devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Aktualizacje zależności via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) Aktualizacje CI — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Aktualizacje zależności via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Wymagany teraz Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) Poprawka: deduplikowane logi błędów połączenia/odpytywania zapobiegają zalewaniu logów i poprawiają gotowość do Sentry
- (ssbingo) Poprawka: zabezpieczenia zamykania i extendForeignObject zapobiegają wyścigom przy wyładowaniu i z interfejsem admina
- (ssbingo) Poprawka: naprawiony wyciek gniazda przy przekroczeniu limitu czasu Modbus; testConnection wstrzymuje teraz odpytywanie; usunięto puste kanały control

### 1.9.7 (2026-04-16)
- (ssbingo) Nowość: dodano obliczone stany plant.pv1Power, plant.pv2Power, plant.pv3Power
