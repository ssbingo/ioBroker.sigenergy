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
## 1.8.21 (2026-03-26)
- (ssbingo) Korekty techniczne: przepływ pracy CI/CD (publikacja OIDC), konfiguracja lintingu, przywrócono standardowe testy

### 1.8.20 (2026-03-26)
* 4 pozostałe błędy prettier naprawione: nawiasy scanner.js, dodatkowa pusta linia main.js, zawinięcie setTimeout, wcięcie kontynuacji łańcucha

### 1.8.19 (2026-03-26)
* Wszystkie pliki JS przekonwertowane z tabulacji na 4 spacje zgodnie ze standardem @iobroker/eslint-config; nawiasy arrow functions poprawione

### 1.8.18 (2026-03-26)
* Standardowa konfiguracja lintera ioBroker: uproszczono eslint.config.mjs i prettier.config.mjs, w pełni delegują do @iobroker/eslint-config

### 1.8.17 (2026-03-26)
* Przywrócono standardowe testy ioBroker: niestandardowe placeholdery zastąpiono tests.unit() i tests.integration() z @iobroker/testing

### 1.8.16 (2026-03-26)
* setInterval zastąpiony pętlą setTimeout aby zapobiec nakładaniu się cykli poll; pollInterval ograniczony do [5 000…300 000 ms]

### 1.8.15 (2026-03-26)
* Wszystkie natywne timery zastąpione wrapperami adaptera; timery adaptera wstrzyknięte do lib/modbus.js i lib/scanner.js przez konstruktor

### 1.8.15 (2026-03-26)
* Natywne timery zastąpione metodami wrapper adaptera (this.setTimeout itp.) dla zagwarantowania anulowania przy unload

### 1.8.14 (2026-03-26)
* Usunięto nieużywany handler onStateChange (adapter nie reaguje na zmiany stanu)

### 1.8.13 (2026-03-26)
* Usunięto patcher util._extend (obejście dla http-proxy, które nie jest zależnością tego adaptera)

### 1.8.12 (2026-03-26)
* serialport przeniesiony do dependencies (W5042); eslint/@eslint/js usunięte z devDependencies; przestarzałe admin/index.html i admin/words.js usunięte

### 1.8.11 (2026-03-26)
* Prefiks 'node:util' użyty dla wbudowanego modułu Node.js (S5043)

### 1.8.10 (2026-03-26)
* Sekcja LICENSE przeniesiona na koniec README.md (po Changelog); dodano pełny tekst licencji MIT; plik LICENSE dodany do korzenia repozytorium

### 1.8.9 (2026-03-18)
* Update Dependencies modbus-serial -> 8.0.25

### 1.8.8 (2026-03-18)
* Sekcja ## Installation usunięta z README.md (S6014); standardowa instalacja przez Admin jest domyślna

### 1.8.7 (2026-03-18)
* npm-token usunięty z workflow (W3019); Trusted Publishing używany dla wydań npm

### 1.8.6 (2026-03-18)
* npm-token dodany do test-and-release.yml dla publikacji npm

### 1.8.5 (2026-03-18)
* npm-token dodany do workflow test-and-release.yml dla publikacji npm

### 1.8.4 (2026-03-16)
* Obszerne logowanie debug: konfiguracja przy starcie, żądania/odpowiedzi FC03/FC04, odkodowane wartości, czasy cyklu na komponent

### 1.8.3 (2026-03-16)
* Usunięto wpis adminTab z nawigacji; cała konfiguracja łącznie ze skanowaniem SigenMicro pozostaje w oknie konfiguracji instancji

### 1.8.2 (2026-03-16)
* Katalogi test/unit i test/integration utworzone; naprawia błąd CI

### 1.8.1 (2026-03-16)
* Skrypty test:unit i test:integration dodane do package.json

### 1.8.0 (2026-03-16)
* Wszystkie pozostałe błędy lint naprawione: wcięcie qty, nawiasy arrow, podziały trójkowe

### 1.7.9 (2026-03-16)
* Wszystkie pozostałe błędy prettier/eslint naprawione: linie >120 znaków, nawiasy arrow

### 1.7.8 (2026-03-16)
* Pozostałe błędy ESLint naprawione: nawiasy arrow, podziały wierszy, formatowanie sendTo, globals mocha

### 1.7.8 (2026-03-16)
* Naprawiono pozostałe błędy ESLint: nawiasy dla arrow functions z jednym param; formatowanie eslint.config.mjs; globals mocha; prettier.config.mjs

### 1.7.7 (2026-03-16)
* Naprawiono wszystkie błędy ESLint: spacje na tabulacje, nawiasy klamrowe po if, nieużywane zmienne, puste bloki catch, JSDoc

### 1.7.6 (2026-03-16)
* Naprawiono W5022: words.js wyczyszczony; pliki i18n zmigrowane do plaskiego LANG.json

### 1.7.5 (2026-03-16)
* Przywrócono i18n:true z plikami admin/i18n/ (zgodność W5022); obiekty wielojęzyczne inline przywrócone do kluczy string

### 1.7.5 (2026-03-16)
* fixed

### 1.7.4 (2026-03-16)
* Poprawiono tłumaczenia: i18n:true zastąpiony obiektami label wielojęzycznymi inline w jsonConfig.json i sigenmicro-tab.json

### 1.7.3 (2026-03-16)
* i18n w sigenmicro-tab.json naprawiona: typ zmieniony z panel na tabs aby Admin 7 przestrzegał i18n:true

### 1.7.2 (2026-03-16)
* Poprawiono wykrywanie języka: words.js przebudowany z 97 kluczami i18n; class=translate dodany

### 1.7.1 (2026-03-16)
* Tłumaczenia i18n dla wszystkich tekstów SigenMicro (21 nowych kluczy w 11 językach)

### 1.7.0 (2026-03-16)
* iframe HTML zastapiony natywna karta jsonConfig; type:state pokazuje postep w czasie rzeczywistym bez JS

### 1.6.3 (2026-03-16)
* Postep skanowania: wszystkie elementy CSS-var zastapione zawsze widoczna skrzynka logu ze stalymi kolorami

### 1.6.2 (2026-03-16)
* Scan: przywrocono chunked sendTo (3 ID na wywolanie); podwojny postep: tekst na chunk + getState z info.scanProgress

### 1.6.1 (2026-03-16)
* Postep skanowania: subscribeState zastapiony setInterval+getState (500ms); timer bezpiecz. 2s/ID

### 1.6.0 (2026-03-16)
* Postep skanowania: State subscription (info.scanProgress) zamiast sendTo chunks; adapter pisze postep na ID

### 1.5.6 (2026-03-16)
* Niewidoczny pasek postepu zastapiony linia tekstowa z procentem i zakresem ID

### 1.5.5 (2026-03-16)
* Naprawa skanowania SigenMicro: ponowne uzycie polaczenia Modbus; pauza pollingu; poprawiony podwojny start

### 1.5.4 (2026-03-16)
* Postep SigenMicro: klasy CSS zastapione przez element.style.display; timeout sondy 1000ms; rozmiar chunk 3

### 1.5.3 (2026-03-16)
* Naprawa postępu skanowania SigenMicro: przejście CSS max-height + animacja shimmer; requestAnimationFrame dla niezawodnego odświeżania

### 1.5.2 (2026-03-16)
* Karta SigenMicro: pasek postępu widoczny; zarezerwowane ID wyświetlane i pomijane; komunikat gdy brak znalezionych urządzeń

### 1.5.1 (2026-03-16)
* Przycisk skanowania SigenMicro dodany bezpośrednio do zakładki jsonConfig; znalezione urządzenia są zapisywane automatycznie

### 1.5.0 (2026-03-16)
* Karta SigenMicro: widoczny przycisk skanowania, pasek postępu w czasie rzeczywistym z zakresem ID i licznikiem urządzeń

### 1.4.1 (2026-03-16)
* Obsługa SigenMicro: skanowanie Modbus, wykrywanie urządzeń, włączanie per urządzenie, dedykowana karta

### 1.4.0 (2026-03-14)
* Poprawki / Czyszczenie

### 1.3.19 (2026-03-14)
* Przywrócono eslint/@eslint/js do 9.x; serialport zaktualizowany do 13.0.0

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
