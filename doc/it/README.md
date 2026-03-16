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

## Licenza

Licenza MIT — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.5.5 (2026-03-16)
* Correzione scan SigenMicro: riutilizzo connessione Modbus; pausa polling; avvio doppio corretto

### 1.5.4 (2026-03-16)
* Avanzamento SigenMicro: classi CSS sostituite da element.style.display; timeout sonda 1000ms; dimensione chunk 3

### 1.5.3 (2026-03-16)
* Correzione avanzamento scan SigenMicro: transizione CSS max-height + animazione shimmer; requestAnimationFrame per ridisegno affidabile

### 1.5.2 (2026-03-16)
* Tab SigenMicro: barra di avanzamento visibile; ID riservati mostrati e saltati; messaggio se nessun dispositivo trovato

### 1.5.1 (2026-03-16)
* Pulsante di scansione SigenMicro aggiunto direttamente nella scheda jsonConfig; i dispositivi trovati vengono salvati automaticamente

### 1.5.0 (2026-03-16)
* Tab SigenMicro: pulsante di scansione prominente, barra di avanzamento in tempo reale con intervallo ID e conteggio dispositivi

### 1.4.1 (2026-03-16)
* Supporto SigenMicro: scansione Modbus, rilevamento dispositivi, attivazione per dispositivo, scheda dedicata

### 1.4.0 (2026-03-14)
* Correzioni / Pulizia

### 1.3.19 (2026-03-14)
* Ripristinato eslint/@eslint/js a 9.x; serialport aggiornato a 13.0.0

### 1.3.18 (2026-03-14)
* Aggiornati eslint 10.0.3, @eslint/js 10.0.1, serialport 13.0.0

### 1.3.17 (2026-03-13)
* Mocha rimosso da devDependencies

### 1.3.16 (2026-03-13)
* Ripristinata dipendenza mocha, corretto script test:package

### 1.3.15 (2026-03-13)
* Corretta indentazione setTimeout in testConnection

### 1.3.14 (2026-03-13)
* Corretti gli ultimi due errori lint

### 1.3.13 (2026-03-13)
* Tutti gli errori ESLint/Prettier corretti: JSDoc, formattazione, import inutilizzati

### 1.3.12 (2026-03-13)
* Fix regressione curly in modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Fix Prettier: virgole finali mancanti in registers.js

### 1.3.10 (2026-03-13)
* Fix Prettier: oggetti registro espansi in formato multilinea

### 1.3.9 (2026-03-13)
* Aggiunta documentazione in README.md - multilingue

### 1.3.8 (2026-03-13)
* Aggiunte traduzioni uk/zh-cn mancanti

### 1.3.7 (2026-03-13)
* Rimossa dipendenza mocha ridondante

### 1.3.6 (2026-03-13)
* Corretta la formattazione Prettier/ESLint

### 1.3.5 (2026-03-13)
* (ssbingo) Fix CI: utilizzare il percorso binario esplicito di mocha per evitare problemi di risoluzione PATH con npm ci

### 1.3.4 (2026-03-13)
* (ssbingo) Fix CI: mocha aggiunto alle devDependencies per consentire l'esecuzione dello script test:package

### 1.3.3 (2026-03-13)
* (ssbingo) Corretto avviso JSDoc @param duplicato causato da tag di chiusura mancante in modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Correzioni qualità codice: variabili inutilizzate rimosse, documentazione JSDoc completata, dichiarazione lessicale nel switch-case corretta

### 1.3.0 (2026-03-13)
* (ssbingo) Documentazione multilingue aggiornata

### 1.2.5 (2026-03-12)
* (ssbingo) Correzioni

### 1.2.4 (2026-03-12)
* (ssbingo) Aggiunta documentazione multilingue in README.md

### 1.2.3 (2026-03-12)
* (ssbingo) Correzioni per AdapterCheck

### 1.2.0 (2026-03-11)
* (ssbingo) StatisticsCalculator aggiornato: reinserite stime del tempo della batteria, tempo di ricarica giornaliero e monitoraggio della copertura della batteria

### 1.1.7 (2026-03-11)
* (ssbingo) Logging migliorato: messaggi debug/info/warn/error per connessione, cicli di polling, letture registro e arresto adattatore

### 1.1.0 (2026-03-09)
* (ssbingo) Interfaccia amministratore migrata da HTML legacy a jsonConfig (Admin 5+)

### 0.1.0 (2026-03-01)
* (ssbingo) Prima versione — supporto Modbus TCP/RTU per sistemi Sigenergy

---

## Documentazione

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
