# ioBroker Sigenergy Adattatore

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adattatore per i sistemi di energia solare Sigenergy tramite Modbus TCP/RTU**

Supporta il protocollo Sigenergy Modbus V2.5 (rilasciato il 2025-02-19).

---

## Funzionalità

- 📡 **Modbus TCP** (Ethernet / WLAN / fibra ottica / 4G) — porta 502
- 🔗 **Modbus RTU** (RS485 seriale)
- ⚡ **Supporto completo dei registri** — tutti i registri di impianto e inverter secondo la specifica V2.5
- 🔋 **Statistiche batteria** — tempo alla carica completa, tempo rimanente, copertura giornaliera
- ☀️ **Statistiche PV** — tasso di autoconsumo, tasso di autosufficienza
- 🔌 **Caricatore AC** (Sigen EVAC) — opzionale
- ⚡ **Caricatore DC** — opzionale
- 📊 **Valori calcolati** — statistiche derivate aggiornate ad ogni ciclo di polling
- 🖥️ **Widget VIS** — flusso energetico, stato batteria, pannelli statistiche

---

## Hardware supportato

| Categoria        | Modelli |
|-----------------|---------|
| **Inverter ibrido** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **Inverter PV** | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Indirizzi Modbus predefiniti

| Dispositivo | Indirizzo |
|------------|-----------|
| Impianto (lettura/scrittura) | **247** |
| Broadcast impianto (scrittura, senza risposta) | **0** |
| Inverter | **1** |
| Caricatore AC (EVAC) | **2** |

---

## Installazione

### Tramite ioBroker Admin (consigliato)
1. Aprire ioBroker Admin → Adattatori
2. Cercare «sigenergy»
3. Installare

---

## Configurazione

### Scheda Connessione
- **Tipo di connessione**: TCP (Ethernet) o Seriale (RS485)
- **Host TCP**: Indirizzo IP dell'inverter
- **Porta TCP**: 502 (predefinita)
- **ID Modbus impianto**: 247 (predefinito)
- **ID Modbus inverter**: 1 (predefinito)

### Scheda Componenti
Selezionare i dispositivi installati:
- Batteria / ESS
- Pannelli PV
- Caricatore AC (EVAC)
- Caricatore DC

### Scheda Statistiche
Scegliere i valori statistici da calcolare:
- Tempo alla carica completa della batteria
- Tempo rimanente della batteria
- Tempo di ricarica giornaliero
- Tempo di copertura della batteria
- Tasso di autoconsumo
- Tasso di autosufficienza

---

## Oggetti dati

### Impianto (`plant.*`)
| Stato | Descrizione | Unità |
|-------|-------------|-------|
| `plant.gridActivePower` | Potenza rete (>0 importazione, <0 esportazione) | kW |
| `plant.pvPower` | Produzione PV | kW |
| `plant.essPower` | Potenza batteria (<0 scarica) | kW |
| `plant.essSoc` | Stato di carica batteria | % |
| `plant.activePower` | Potenza attiva totale impianto | kW |
| `plant.runningState` | Stato impianto (0=Standby, 1=Attivo...) | - |

### Inverter (`inverter.*`)
| Stato | Descrizione | Unità |
|-------|-------------|-------|
| `inverter.pvPower` | Potenza PV all'inverter | kW |
| `inverter.essBatterySoc` | SOC batteria | % |
| `inverter.essBatterySoh` | SOH batteria | % |
| `inverter.essBatteryTemperature` | Temperatura batteria | °C |
| `inverter.phaseAVoltage` | Tensione fase A | V |
| `inverter.gridFrequency` | Frequenza rete | Hz |

### Statistiche (`statistics.*`)
| Stato | Descrizione | Unità |
|-------|-------------|-------|
| `statistics.batteryTimeToFull` | Minuti alla batteria piena | min |
| `statistics.batteryTimeRemaining` | Tempo rimanente batteria | min |
| `statistics.selfConsumptionRate` | Tasso di autoconsumo | % |
| `statistics.autarkyRate` | Tasso di autosufficienza | % |
| `statistics.housePower` | Consumo domestico calcolato | kW |

---

## Widget VIS

> **Nota:** Tutti i 7 widget sono forniti dall'adattatore separato [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy). Installarlo insieme a questo adattatore per utilizzare i widget in VIS-2.

### Widget flusso energetico
Mostra il flusso energetico animato tra PV → Batteria ↔ Rete → Casa.

### Widget stato batteria
Mostra la barra SOC, il badge SOH, il tempo alla carica/scarica completa, la potenza attuale.

### Widget panoramica potenza
Lettura in tempo reale di tutti e quattro i flussi di potenza.

### Widget statistiche
Autosufficienza odierna, autoconsumo, SOC min/max, tempo di copertura della batteria.

### Widget inverter
Dati inverter in tempo reale: potenza PV, frequenza rete, tensioni di fase, temperatura.

### Widget caricatore AC (EVAC)
Stato e misure di potenza della stazione di ricarica Sigen EVAC.

### Widget caricatore DC
Stato e misure di potenza del caricatore DC.

---

## Protocollo di comunicazione

- Modbus TCP: modalità TCP, full duplex, porta 502 (slave)
- Modbus RTU: half duplex, 9600 bps, 8N1
- Intervallo di polling minimo: 1000 ms (1 secondo) secondo la specifica Sigenergy
- Timeout: 1000 ms secondo la specifica Sigenergy

---

## Changelog

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Funzionalità: statistiche estese — statistiche impianto (30088–30097), carichi intelligenti 1–24 (30098–30193), energia cumulata (30194–30271), feedback regolazione (30613–30619), parametri codice rete (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Funzionalità: Protocollo Modbus V2.9 — nuovi registri impianto/inverter/caricatore DC, registri obsoleti rimossi, enumerazioni estese

### 1.9.17 (2026-06-08)
- (ssbingo) Fix: rimosso formato lungo i18n duplicato (admin/i18n), aggiunta chiave di traduzione /dev/ttyUSB0

### 1.9.16 (2026-06-08)
- (ssbingo) Chore: devDependency @alcalzone/release-script aggiornata a ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) Chore: aggiunto @tsconfig/node22 come devDependency (aggiornamento template ioBroker)
- (ssbingo) Chore: testing-action-check aggiornato a @v2
- (ssbingo) Chore: aggiornamento sicurezza axios

### 1.9.14 (2026-05-27)
- (ssbingo) Fix: correzioni pipeline CI — Node.js 24, @types/node ^22.0.0, package-lock.json corretto; solo l'ultima voce in common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Fix: package-lock.json aggiornato per @types/node ^22.0.0 (era bloccato su 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) Fix: @types/node fissato a ^22.0.0 nelle devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) Fix: Node.js 24 per i job CI check-and-lint e deploy
- (ssbingo) Chore: aggiunto @types/node come devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Aggiornamento dipendenze via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) Aggiornamenti CI — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Aggiornamento dipendenze via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Ora richiede Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) Correzione: log di errore connessione/polling deduplicati per evitare flooding dei log e migliorare la compatibilità con Sentry
- (ssbingo) Correzione: protezioni di shutdown ed extendForeignObject prevengono race condition allo scaricamento e con l'interfaccia admin
- (ssbingo) Correzione: risolto leak di socket al timeout Modbus; testConnection ora mette in pausa il polling; rimossi canali control vuoti

### 1.9.7 (2026-04-16)
- (ssbingo) Novità: aggiunti stati calcolati plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.6 (2026-04-16)
- (ssbingo) Novità: aggiunti stati calcolati plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.5 (2026-04-08)
- (ssbingo) Correzione: rimosso common.schedule inutilizzato da io-package.json

### 1.9.4 (2026-04-08)
- (ssbingo) Correzione: Changelog / aggiunto CHANGELOG_OLD.md

### 1.9.3 (2026-04-08)
- (ssbingo) Correzione: rimosso admin/index.html

### 1.9.2 (2026-04-08)
- (ssbingo) Correzioni

### 1.9.1 (2026-04-08)
- (ssbingo) Interfaccia di amministrazione corretta: rimossi i file legacy index.html/index_m.html/words.js; corretto il tipo jsonData nei pulsanti sendTo di jsonConfig

### 1.9.0 (2026-03-26)
- (ssbingo) Test completato

### 1.8.23 (2026-03-26)
- (ssbingo) Anno di copyright corretto a 2026 in LICENSE e README; correzioni tecniche: CI/CD, linting, test

