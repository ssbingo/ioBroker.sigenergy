# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter dla systemów energii słonecznej Sigenergy przez Modbus TCP/RTU**

Obsługuje protokół Sigenergy Modbus V2.5 (wydany 2025-02-19).

---

## Funkcje

- 📡 **Modbus TCP** (Ethernet / WLAN / światłowód / 4G) — port 502
- 🔗 **Modbus RTU** (RS485 szeregowy)
- ⚡ **Pełna obsługa rejestrów** — wszystkie rejestry instalacji i falownika według specyfikacji V2.5
- 🔋 **Statystyki baterii** — czas do pełnego naładowania, czas pozostały, dzienna pokrycie
- ☀️ **Statystyki PV** — wskaźnik autokonsumpcji, wskaźnik autarkii
- 🔌 **Ładowarka AC** (Sigen EVAC) — opcjonalna
- ⚡ **Ładowarka DC** — opcjonalna
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


### 1.9.6 (2026-04-16)
- (ssbingo) Nowość: dodano obliczone stany plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.5 (2026-04-08)
- (ssbingo) Poprawka: usunięto nieużywany common.schedule z io-package.json

### 1.9.4 (2026-04-08)
- (ssbingo) Poprawka: Changelog / dodano CHANGELOG_OLD.md

### 1.9.3 (2026-04-08)
- (ssbingo) Poprawka: usunięto admin/index.html

### 1.9.2 (2026-04-08)
- (ssbingo) Poprawki

### 1.9.1 (2026-04-08)
- (ssbingo) Poprawiono interfejs administratora: usunięto przestarzałe pliki index.html/index_m.html/words.js; naprawiono typ jsonData w przyciskach sendTo konfiguracji jsonConfig

### 1.9.0 (2026-03-26)
- (ssbingo) Test zakończony

### 1.8.23 (2026-03-26)
- (ssbingo) Poprawiono rok praw autorskich na 2026 w LICENSE i README; korekty techniczne: CI/CD, linting, testy

