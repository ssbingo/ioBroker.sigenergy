# ioBroker Sigenergy Adattatore

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adattatore per i sistemi di energia solare Sigenergy tramite Modbus TCP/RTU**

Supporta il protocollo Sigenergy Modbus V2.9 (rilasciato il 2026-05-13).

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

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

## Disconnessione d'emergenza — protezione dei sistemi fotovoltaici esterni

### Contesto

Gli inverter ibridi Sigenergy dispongono di un **gateway di emergenza** opzionale
che passa automaticamente alla modalità off-grid / isola in caso di mancanza di rete.
In questa modalità il sistema Sigenergy genera una propria rete locale in corrente alternata,
alimentata dalla batteria.

Se un **secondo sistema fotovoltaico** — come una centrale da balcone, un micro-inverter
o un inverter di stringa di terze parti — è collegato allo stesso circuito domestico,
continuerà ad immettere energia in questa rete locale isolata. La maggior parte degli
inverter connessi alla rete non è progettata per questa situazione e può:

- sovraccaricare la gestione della batteria Sigenergy
- destabilizzare la tensione o la frequenza nella rete in isola
- subire danni a causa delle condizioni di funzionamento insolite

L'unica soluzione sicura è la **disconnessione immediata** del sistema esterno
non appena Sigenergy entra in modalità off-grid.

### Come l'adattatore gestisce questa situazione

L'adattatore monitora lo stato `plant.onOffGridStatus` ad ogni ciclo di polling.

**In caso di mancanza di rete** (`onOffGridStatus` = 1 o 2):
- Tutti i dispositivi d'emergenza configurati vengono commutati immediatamente
- Viene inviata una notifica Telegram (opzionale)

**Al ritorno della rete** (`onOffGridStatus` = 0):
- Parte un timer di stabilizzazione configurabile (predefinito: 10 minuti)
- Se la rete rimane stabile per l'intera durata, i dispositivi vengono ripristinati
- Se la rete cade di nuovo durante il timer, il timer viene annullato
  e i dispositivi rimangono spenti
- Al ripristino riuscito viene inviata una notifica Telegram (opzionale)

### Attivazione della funzione

**Passo 1 — scheda Componenti**  
Spuntare **Gateway di emergenza (commutazione off-grid)**.  
La scheda *Disconnessione d'emergenza* diventa visibile.

**Passo 2 — scheda Disconnessione d'emergenza**

#### Dispositivi

| Campo | Descrizione |
|---|---|
| **Ritardo di stabilizzazione (minuti)** | Per quanto tempo la rete deve rimanere stabile prima di riaccendere i dispositivi. Consiglio: 10 minuti. |
| **Dispositivo 1 — ID oggetto** | L'ID stato ioBroker dell'interruttore principale del sistema esterno. Impostato su `false` in caso di mancanza di rete; `true` dopo un ripristino stabile. |
| **Dispositivi 2–4 — ID oggetto** | Dispositivi opzionali aggiuntivi. |
| **Dispositivi 2–4 — Direzione** | *SPENTO in caso di guasto, ACCESO dopo il ripristino* o *ACCESO in caso di guasto, SPENTO dopo il ripristino*. |

#### Notifiche Telegram (opzionale)

| Campo | Descrizione |
|---|---|
| **Abilita notifica Telegram** | Attiva le notifiche in caso di mancanza e ripristino della rete. |
| **Istanza Telegram** | Selezionare l'istanza dell'adattatore `telegram.x` da utilizzare. |
| **ID chat** | Opzionale: limita a una chat specifica. Lasciare vuoto per la trasmissione a tutti. |

### Esempio — centrale da balcone

Un relè Shelly Plus 1 è cablato in serie con il cavo di alimentazione della centrale da balcone.
Il suo ID stato ioBroker è `shelly.0.SHPLUS1-ABC123.Relay0.Switch`.

Configurazione:
- **Dispositivo 1**: `shelly.0.SHPLUS1-ABC123.Relay0.Switch`  
  → Il relè si apre (`false`) in caso di mancanza di rete, si chiude (`true`) dopo un ripristino stabile

La centrale da balcone è ora automaticamente protetta.

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

### 3.0.5 (2026-06-14)
- (ssbingo) fix: aggiunto il campo license mancante nel blocco common di io-package.json

### 3.0.4 (2026-06-14)
- (ssbingo) Correzione: la notifica Telegram in caso di mancanza di rete viene ora inviata una sola volta (non ad ogni poll); la commutazione dei dispositivi è limitata a 3 tentativi massimi (iniziale + 2 ripetizioni) in modalità off-grid

### 3.0.3 (2026-06-13)
- (ssbingo) Correzione: welcomeText non funzionale rimosso da io-package.json; avviso staticText visibile aggiunto nella scheda Disconnessione d'emergenza (riquadro giallo, i18n in tutte le 11 lingue)

### 3.0.2 (2026-06-13)
- (ssbingo) Correzione: errori ESLint/Prettier nei metodi di disconnessione d'emergenza — variabile inutilizzata rimossa, indentazione corretta, tipi JSDoc @param aggiunti

### 3.0.1 (2026-06-13)
- (ssbingo) Nuovo: welcomeText aggiunto a io-package.json — avviso multilingue sulla funzione di disconnessione d'emergenza

### 3.0.0 (2026-06-13)
- (ssbingo) Nuovo: disconnessione d'emergenza — scollegamento automatico dei sistemi fotovoltaici esterni (centrali da balcone, micro-inverter) in caso di mancanza di rete; timer di stabilizzazione configurabile al ripristino della rete; notifiche Telegram opzionali
- (ssbingo) Docs: documentazione disconnessione d'emergenza aggiunta in tutte le 11 lingue

### 2.5.2 (2026-06-12)
- (ssbingo) fix: spazi nell'URL del pulsante Buy Me a Coffee codificati come %20 — l'immagine non veniva visualizzata su GitHub

### 2.5.1 (2026-06-12)
- (ssbingo) fix: corretta la role dell'instanceObject info.modelType da 'info.name' a 'text' (avvisi W1133/W1135 dell'adapter-checker)

### 2.5.0 (2026-06-12)

- (ssbingo) Sicurezza di scrittura architetturale: le scritture Modbus vengono rifiutate direttamente nel dispatcher quando il registro di destinazione non è valido per il tipo di dispositivo configurato (gating models in onStateChange, guardia plant per solo SigenMicro)
- (ssbingo) Controllo TypeScript corretto — nuovo `lib/adapter-config.d.ts` con dichiarazione AdapterConfig completa, costruttore modbus-serial tipizzato, annotazioni ioBroker.CommonType/SettableObject; il nuovo script `npm run check` passa con 0 errori
- (ssbingo) La configurazione ESLint consente i tag JSDoc `@type` in questo progetto JavaScript verificato (jsdoc/check-tag-names con typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Architettura dei tipi di dispositivo: selettore obbligatorio (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / inverter solo PV / solo SigenMicro) con separazione rigorosa dei registri secondo le note del protocollo V2.9
- (ssbingo) Supporto ufficiale per Sigen Hybrid e inverter solo PV (Sigen PV / PV Max)
- (ssbingo) Rilevamento automatico del tipo di dispositivo dall'hardware nell'admin (registri 30500 / 31024)
- (ssbingo) Verifica del modello all'avvio — avvisa in caso di divergenza tra configurazione e hardware (nuovo stato info.modelType)
- (ssbingo) Registri PV dinamici: PV5-PV16 tensione/corrente in base al numero di stringhe del registro 31025
- (ssbingo) Controllo del fattore di potenza PCC (40157/40158) solo per M1-HYB; preriscaldamento ESS solo M1-HYB; caricatore DC e grid code solo SigenStor/Sigen Hybrid
- (ssbingo) Migrazione automatica delle configurazioni precedenti alla 2.4.0 e pulizia dei canali non validi per il tipo di dispositivo selezionato

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
