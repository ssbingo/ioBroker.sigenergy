# ioBroker Sigenergy Adattatore

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adattatore per i sistemi di energia solare Sigenergy tramite Modbus TCP/RTU**

Supporta il protocollo Sigenergy Modbus V2.9 (rilasciato il 2026-05-13).

---

## Funzionalità

- 📡 **Modbus TCP** (Ethernet / WLAN / fibra ottica / 4G) — porta 502
- 🔗 **Modbus RTU** (RS485 seriale)
- ⚡ **Supporto completo dei registri** — tutti i registri di impianto, inverter, PSS e PID secondo la specifica V2.9
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
- PSS (commutatore di potenza)
- PID (rilevamento isolamento PV)
- Preriscaldamento ESS (solo M1-HYA/HYB)
- SigenMicro (micro-inverter)

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

### 2.3.4 (2026-06-12)
- (ssbingo) fix: correzione del rilevamento del livello di protocollo — quantità di registri corrette per le probe, ordine decrescente V2.9→V2.6, distinzione errori di trasporto da eccezioni del dispositivo per evitare falso rapporto pre-V2.6

### 2.3.3 (2026-06-11)
- (ssbingo) fix: sopprimere gli avvisi ripetuti di lettura registro dopo la prima occorrenza per plant/inverter/acCharger/dcCharger/pss/pid; i guasti successivi vengono registrati solo a livello debug

### 2.3.2 (2026-06-10)
- (ssbingo) fix: mostrare 'pre-V2.6' invece di 'unknown' quando il dispositivo risponde ma non ha registri plant estesi; log di debug per sonda con messaggio di eccezione Modbus

### 2.3.1 (2026-06-10)
- (ssbingo) feat: rilevamento del livello del protocollo Modbus all'avvio sondando i registri 30088/30200/30228/30286; lettura della versione firmware (30525); registrazione del risultato e salvataggio come stato info.protocolLevel

### 2.3.0 (2026-06-10)
- (ssbingo) feat: mappe enum common.states aggiunte per emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState; registri di scrittura PSS/PID/AC Charger (FC06/FC10) cablati con subscribe e handler onStateChange

### 2.2.7 (2026-06-10)
- (ssbingo) Correzione: default native enableSmartLoads/enableCumulativeEnergy/enableGridCode aggiunti a io-package.json
- (ssbingo) Correzione: descrizione registro 30003 aggiornata con modalità EMS V2.7 5 (FullFeedIn) e 9 (Custom)

### 2.2.6 (2026-06-10)
- (ssbingo) Novità: audit registri V2.9 — registro mancante 30279 aggiunto, registri PV DC Charger 31509/31511 spostati nel namespace dcCharger, gain TOU ESS Preheating corretto
- (ssbingo) Novità: scrittura di ritorno dei registri di controllo plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); registri RW letti all'avvio
- (ssbingo) Correzione: avvisi ripetuti ESS Preheating soppressi; errori di lettura dei registri di controllo all'avvio ridotti a debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: lettura TOU preriscaldamento ESS (FC03, 50000–50183) e scrittura implementate; encodeValue aggiunto

### 2.2.3 (2026-06-10)
- (ssbingo) fix: aggiunte 25 chiavi i18n mancanti (PSS, PID, preriscaldamento ESS, registri estesi) in tutte le 11 lingue

### 2.2.2 (2026-06-09)
- (ssbingo) docs: aggiornamento di tutti i README al protocollo Modbus V2.9 — aggiunti PSS, PID, preriscaldamento ESS, registri estesi, SigenMicro

### 2.2.1 (2026-06-09)
- (ssbingo) fix: tabella registri PSS corretta a 122 voci secondo spec ufficiale V2.9 (indirizzi, gain, tipi); registri scrittura PSS corretti a 6 voci WO; registri PID 33055-33060 corretti (tipi, gain, 2 voci mancanti)

### 2.2.0 (2026-06-09)
- (ssbingo) Funzionalità: supporto PSS (commutatore di potenza) e PID (rilevamento isolamento PV); registri programma TOU preriscaldamento ESS; nuove opzioni admin per ID slave PSS/PID

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
