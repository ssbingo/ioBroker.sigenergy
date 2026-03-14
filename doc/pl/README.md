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

## Licencja

Licencja MIT — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.3.18 (2026-03-14)
* Zaktualizowano eslint 10.0.3, @eslint/js 10.0.1, serialport 13.0.0

### 1.3.17 (2026-03-13)
* Mocha usunięty z devDependencies

### 1.3.16 (2026-03-13)
* Przywrócono zależność mocha, naprawiono skrypt test:package

### 1.3.15 (2026-03-13)
* Poprawiono wcięcie setTimeout w testConnection

### 1.3.14 (2026-03-13)
* Naprawiono ostatnie dwa błędy lint

### 1.3.13 (2026-03-13)
* Wszystkie błędy ESLint/Prettier naprawione: JSDoc, formatowanie, nieużywane importy

### 1.3.12 (2026-03-13)
* Naprawa regresji curly w modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Naprawa Prettier: brakujące przecinki końcowe w registers.js

### 1.3.10 (2026-03-13)
* Naprawa Prettier: obiekty rejestru rozwinięte do formatu wieloliniowego

### 1.3.9 (2026-03-13)
* Dodano dokumentację w README.md - wielojęzyczna

### 1.3.8 (2026-03-13)
* Dodano brakujące tłumaczenia uk/zh-cn

### 1.3.7 (2026-03-13)
* Usunięto redundantną zależność mocha

### 1.3.6 (2026-03-13)
* Naprawiono formatowanie Prettier/ESLint

### 1.3.5 (2026-03-13)
* (ssbingo) Poprawka CI: użycie jawnej ścieżki binarnej mocha, aby uniknąć problemów z rozwiązywaniem PATH przy npm ci

### 1.3.4 (2026-03-13)
* (ssbingo) Poprawka CI: dodano mocha do devDependencies, aby skrypt test:package mógł działać

### 1.3.3 (2026-03-13)
* (ssbingo) Poprawiono zduplikowane ostrzeżenie JSDoc @param spowodowane brakującym tagiem zamykającym w modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Poprawki jakości kodu: usunięto nieużywane zmienne, uzupełniono dokumentację JSDoc, poprawiono deklarację leksykalną w switch-case

### 1.3.0 (2026-03-13)
* (ssbingo) Wielojęzyczna dokumentacja zaktualizowana

### 1.2.5 (2026-03-12)
* (ssbingo) Poprawki

### 1.2.4 (2026-03-12)
* (ssbingo) Dodano wielojęzyczną dokumentację do README.md

### 1.2.3 (2026-03-12)
* (ssbingo) Poprawki dla AdapterCheck

### 1.2.0 (2026-03-11)
* (ssbingo) Zaktualizowano StatisticsCalculator: przywrócono szacowanie czasu baterii, dzienny czas ładowania i śledzenie pokrycia baterii

### 1.1.7 (2026-03-11)
* (ssbingo) Ulepszone logowanie: komunikaty debug/info/warn/error dla połączenia, cykli pollingu, odczytów rejestrów i zamknięcia adaptera

### 1.1.0 (2026-03-09)
* (ssbingo) Interfejs administratora przeniesiony z legacy HTML do jsonConfig (Admin 5+)

### 0.1.0 (2026-03-01)
* (ssbingo) Pierwsze wydanie — obsługa Modbus TCP/RTU dla systemów Sigenergy

---

## Dokumentacja

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
