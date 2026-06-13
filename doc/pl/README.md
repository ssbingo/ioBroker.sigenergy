# ioBroker Sigenergy Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adapter dla systemów energii słonecznej Sigenergy przez Modbus TCP/RTU**

Obsługuje protokół Sigenergy Modbus V2.9 (wydany 2026-05-13).

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

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

## Wyłączenie awaryjne — ochrona zewnętrznych systemów fotowoltaicznych

### Kontekst

Hybrydowe falowniki Sigenergy posiadają opcjonalną **bramę zasilania awaryjnego**,
która automatycznie przełącza się w tryb off-grid / wyspy przy zaniku zasilania sieciowego.
W tym trybie system Sigenergy generuje własną lokalną sieć prądu przemiennego,
zasilaną z akumulatora.

Jeśli do tego samego obwodu domowego podłączony jest **drugi system fotowoltaiczny** —
np. elektrownia balkonowa, mikroinwerter lub falownik łańcuchowy innej firmy —
będzie on nadal zasilał tę izolowaną lokalną sieć. Większość falowników sieciowych
nie jest zaprojektowana do takiej pracy i może:

- przeciążyć system zarządzania akumulatorem Sigenergy
- zdestabilizować napięcie lub częstotliwość w sieci wyspowej
- ulec uszkodzeniu z powodu niestandardowych warunków pracy

Jedynym bezpiecznym rozwiązaniem jest **natychmiastowe odłączenie** zewnętrznego systemu
gdy tylko Sigenergy przejdzie w tryb off-grid.

### Sposób działania w adapterze

Adapter monitoruje stan `plant.onOffGridStatus` w każdym cyklu odpytywania.

**Przy zaniku sieci** (`onOffGridStatus` = 1 lub 2):
- Wszystkie skonfigurowane urządzenia awaryjne są natychmiast przełączane
- Opcjonalnie wysyłane jest powiadomienie Telegram

**Przy powrocie sieci** (`onOffGridStatus` = 0):
- Uruchamiany jest konfigurowalny timer stabilizacji (domyślnie: 10 minut)
- Jeśli sieć pozostaje stabilna przez cały czas, urządzenia są przywracane
- Jeśli sieć zaniknie ponownie podczas timera, timer jest anulowany
  i urządzenia pozostają wyłączone
- Po pomyślnym przywróceniu opcjonalnie wysyłane jest powiadomienie Telegram

### Aktywacja funkcji

**Krok 1 — zakładka Komponenty**  
Zaznaczyć pole **Brama awaryjna (przełączanie off-grid)**.  
Zakładka *Wyłączenie awaryjne* staje się widoczna.

**Krok 2 — zakładka Wyłączenie awaryjne**

#### Urządzenia

| Pole | Opis |
|---|---|
| **Czas stabilizacji (minuty)** | Jak długo sieć musi pozostawać stabilna przed ponownym włączeniem urządzeń. Zalecenie: 10 minut. |
| **Urządzenie 1 — ID obiektu** | ID stanu ioBroker głównego przełącznika systemu zewnętrznego. Przy zaniku sieci ustawiany na `false`; po stabilnym powrocie na `true`. |
| **Urządzenia 2–4 — ID obiektu** | Dodatkowe opcjonalne urządzenia. |
| **Urządzenia 2–4 — Kierunek** | *WYŁ przy zaniku, WŁ po powrocie* lub *WŁ przy zaniku, WYŁ po powrocie*. |

#### Powiadomienia Telegram (opcjonalnie)

| Pole | Opis |
|---|---|
| **Włącz powiadomienie Telegram** | Aktywuje powiadomienia przy zaniku i powrocie sieci. |
| **Instancja Telegram** | Wybrać instancję adaptera `telegram.x` do użycia. |
| **ID czatu** | Opcjonalnie: ograniczyć do konkretnego czatu. Pozostawić puste dla rozsyłania do wszystkich. |

### Przykład — elektrownia balkonowa

Przekaźnik Shelly Plus 1 jest włączony szeregowo w przewód zasilający elektrowni balkonowej.
Jego ID stanu ioBroker to `shelly.0.SHPLUS1-ABC123.Relay0.Switch`.

Konfiguracja:
- **Urządzenie 1**: `shelly.0.SHPLUS1-ABC123.Relay0.Switch`  
  → Przekaźnik otwiera się (`false`) przy zaniku sieci, zamyka się (`true`) po stabilnym powrocie

Elektrownia balkonowa jest teraz automatycznie chroniona.

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

### 3.0.0 (2026-06-13)
- (ssbingo) Nowe: wyłączenie awaryjne — automatyczne odłączanie zewnętrznych systemów fotowoltaicznych (elektrowni balkonowych, mikroinwerterów) przy zaniku sieci; konfigurowalny timer stabilizacji przy powrocie sieci; opcjonalne powiadomienia Telegram
- (ssbingo) Docs: dokumentacja wyłączenia awaryjnego dodana we wszystkich 11 językach

### 2.5.2 (2026-06-12)
- (ssbingo) fix: spacje w URL przycisku Buy Me a Coffee zakodowane jako %20 — obraz nie był wyświetlany na GitHub

### 2.5.1 (2026-06-12)
- (ssbingo) fix: poprawiono rolę instanceObject info.modelType z 'info.name' na 'text' (ostrzeżenia W1133/W1135 adapter-checker)

### 2.5.0 (2026-06-12)

- (ssbingo) Architektoniczne bezpieczeństwo zapisu: zapisy Modbus są odrzucane bezpośrednio w dyspozytorze, gdy rejestr docelowy jest nieprawidłowy dla skonfigurowanego typu urządzenia (gating models w onStateChange, ochrona plant dla trybu tylko SigenMicro)
- (ssbingo) Naprawiono sprawdzanie TypeScript — nowy `lib/adapter-config.d.ts` z pełną deklaracją AdapterConfig, typowany konstruktor modbus-serial, adnotacje ioBroker.CommonType/SettableObject; nowy skrypt `npm run check` przechodzi z 0 błędami
- (ssbingo) Konfiguracja ESLint zezwala na tagi JSDoc `@type` w tym sprawdzanym projekcie JavaScript (jsdoc/check-tag-names z typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Architektura typów urządzeń: obowiązkowy selektor (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / falownik tylko PV / tylko SigenMicro) ze ścisłym rozdzieleniem rejestrów zgodnie z przypisami protokołu V2.9
- (ssbingo) Oficjalne wsparcie dla Sigen Hybrid i falowników tylko PV (Sigen PV / PV Max)
- (ssbingo) Automatyczne wykrywanie typu urządzenia ze sprzętu w adminie (rejestry 30500 / 31024)
- (ssbingo) Weryfikacja modelu przy starcie — ostrzega przy niezgodności konfiguracji i wykrytego sprzętu (nowy stan info.modelType)
- (ssbingo) Dynamiczne rejestry stringów PV: PV5-PV16 napięcie/prąd według liczby stringów z rejestru 31025
- (ssbingo) Sterowanie współczynnikiem mocy PCC (40157/40158) tylko dla M1-HYB; podgrzewanie ESS tylko M1-HYB; ładowarka DC i grid code tylko SigenStor/Sigen Hybrid
- (ssbingo) Automatyczna migracja konfiguracji sprzed 2.4.0 i czyszczenie kanałów nieprawidłowych dla wybranego typu urządzenia

### 2.3.4 (2026-06-12)
- (ssbingo) fix: poprawka wykrywania poziomu protokołu — właściwe ilości rejestrów dla sond, kolejność malejąca V2.9→V2.6, rozróżnienie błędów transportu od wyjątków urządzenia w celu uniknięcia fałszywego raportu pre-V2.6

### 2.3.3 (2026-06-11)
- (ssbingo) fix: tłumienie powtarzających się ostrzeżeń o odczycie rejestrów po pierwszym wystąpieniu dla plant/inverter/acCharger/dcCharger/pss/pid; kolejne błędy rejestrowane tylko na poziomie debug

### 2.3.2 (2026-06-10)
- (ssbingo) fix: pokazywać 'pre-V2.6' zamiast 'unknown' gdy urządzenie odpowiada ale nie ma rozszerzonych rejestrów plant; log debugowania na sondę z komunikatem wyjątku Modbus

### 2.3.1 (2026-06-10)
- (ssbingo) feat: wykrywanie poziomu protokołu Modbus przy uruchomieniu przez próbkowanie rejestrów 30088/30200/30228/30286; odczyt wersji firmware (30525); logowanie wyniku i zapis jako stan info.protocolLevel

### 2.3.0 (2026-06-10)
- (ssbingo) feat: mapy enum common.states dodane dla emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState; rejestry zapisu PSS/PID/AC Charger (FC06/FC10) podłączone z subscribe i handlerami onStateChange

### 2.2.7 (2026-06-10)
- (ssbingo) Poprawka: brakujące domyślne native enableSmartLoads/enableCumulativeEnergy/enableGridCode dodane do io-package.json
- (ssbingo) Poprawka: opis rejestru 30003 zaktualizowany o tryby EMS V2.7 5 (FullFeedIn) i 9 (Custom)

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
