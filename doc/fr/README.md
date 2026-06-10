# ioBroker Sigenergy Adaptateur

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptateur pour les systèmes d'énergie solaire Sigenergy via Modbus TCP/RTU**

Supporte le protocole Sigenergy Modbus V2.9 (publié le 2026-05-13).

---

## Fonctionnalités

- 📡 **Modbus TCP** (Ethernet / WLAN / fibre optique / 4G) — port 502
- 🔗 **Modbus RTU** (RS485 série)
- ⚡ **Support complet des registres** — tous les registres d'installation, d'onduleur, PSS et PID selon la spécification V2.9
- 🔋 **Statistiques de batterie** — temps de charge complète, temps restant, couverture journalière
- ☀️ **Statistiques PV** — taux d'autoconsommation, taux d'autarcie
- 🔌 **Chargeur AC** (Sigen EVAC) — optionnel
- ⚡ **Chargeur DC** — optionnel
- 📊 **Valeurs calculées** — statistiques dérivées mises à jour à chaque cycle de polling
- 🖥️ **Widgets VIS** — flux d'énergie, état de la batterie, panneaux de statistiques

---

## Matériel supporté

| Catégorie        | Modèles |
|-----------------|---------|
| **Onduleur hybride** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **Onduleur PV** | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Adresses Modbus par défaut

| Appareil | Adresse |
|---------|---------|
| Installation (lecture/écriture) | **247** |
| Diffusion installation (écriture, sans réponse) | **0** |
| Onduleur | **1** |
| Chargeur AC (EVAC) | **2** |

---

## Configuration

### Onglet Connexion
- **Type de connexion** : TCP (Ethernet) ou Série (RS485)
- **Hôte TCP** : Adresse IP de l'onduleur
- **Port TCP** : 502 (par défaut)
- **ID Modbus installation** : 247 (par défaut)
- **ID Modbus onduleur** : 1 (par défaut)

### Onglet Composants
Sélectionner les appareils installés :
- Batterie / ESS
- Panneaux PV
- Chargeur AC (EVAC)
- Chargeur DC
- PSS (commutateur de puissance)
- PID (détection d'isolation PV)
- Préchauffage ESS (M1-HYA/HYB uniquement)
- SigenMicro (micro-onduleurs)

### Onglet Statistiques
Choisir les valeurs statistiques à calculer :
- Temps jusqu'à la charge complète
- Temps restant de la batterie
- Temps de charge journalier
- Temps de couverture de la batterie
- Taux d'autoconsommation
- Taux d'autarcie

---

## Objets de données

### Installation (`plant.*`)
| État | Description | Unité |
|------|-------------|-------|
| `plant.gridActivePower` | Puissance réseau (>0 import, <0 export) | kW |
| `plant.pvPower` | Production PV | kW |
| `plant.essPower` | Puissance batterie (<0 décharge) | kW |
| `plant.essSoc` | État de charge de la batterie | % |
| `plant.activePower` | Puissance active totale de l'installation | kW |
| `plant.runningState` | État de l'installation (0=Veille, 1=Actif...) | - |

### Onduleur (`inverter.*`)
| État | Description | Unité |
|------|-------------|-------|
| `inverter.pvPower` | Puissance PV à l'onduleur | kW |
| `inverter.essBatterySoc` | SOC de la batterie | % |
| `inverter.essBatterySoh` | SOH de la batterie | % |
| `inverter.essBatteryTemperature` | Température de la batterie | °C |
| `inverter.phaseAVoltage` | Tension phase A | V |
| `inverter.gridFrequency` | Fréquence du réseau | Hz |

### Statistiques (`statistics.*`)
| État | Description | Unité |
|------|-------------|-------|
| `statistics.batteryTimeToFull` | Minutes jusqu'à la batterie pleine | min |
| `statistics.batteryTimeRemaining` | Temps restant de la batterie | min |
| `statistics.selfConsumptionRate` | Taux d'autoconsommation | % |
| `statistics.autarkyRate` | Taux d'autarcie | % |
| `statistics.housePower` | Consommation domestique calculée | kW |

---

## Widgets VIS

> **Remarque :** Les 7 widgets sont fournis par l'adaptateur séparé [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy). Installez-le avec cet adaptateur pour utiliser les widgets dans VIS-2.

### Widget flux d'énergie
Affiche le flux d'énergie animé entre PV → Batterie ↔ Réseau → Maison.

### Widget état de la batterie
Affiche la barre SOC, le badge SOH, le temps jusqu'à plein/vide, la puissance actuelle.

### Widget aperçu de puissance
Lecture en direct des quatre flux de puissance.

### Widget statistiques
Autarcie du jour, autoconsommation, SOC min/max, temps de couverture de la batterie.

### Widget onduleur
Données d'onduleur en temps réel : puissance PV, fréquence réseau, tensions de phase, température.

### Widget chargeur AC (EVAC)
État et mesures de puissance de la borne de recharge Sigen EVAC.

### Widget chargeur DC
État et mesures de puissance du chargeur DC.

---

## Protocole de communication

- Modbus TCP : mode TCP, full duplex, port 502 (esclave)
- Modbus RTU : half duplex, 9600 bps, 8N1
- Intervalle de polling minimum : 1000 ms (1 seconde) selon la spécification Sigenergy
- Délai d'expiration : 1000 ms selon la spécification Sigenergy

---

## Changelog

### 2.3.0 (2026-06-10)
- (ssbingo) feat: cartes enum common.states ajoutées pour emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState ; registres d'écriture PSS/PID/AC Charger (FC06/FC10) câblés avec subscribe et handlers onStateChange

### 2.2.7 (2026-06-10)
- (ssbingo) Correctif : defaults native enableSmartLoads/enableCumulativeEnergy/enableGridCode ajoutés à io-package.json
- (ssbingo) Correctif : description registre 30003 mise à jour avec modes EMS V2.7 5 (FullFeedIn) et 9 (Custom)

### 2.2.6 (2026-06-10)
- (ssbingo) Nouveau : audit des registres V2.9 — registre 30279 manquant ajouté, registres PV DC Charger 31509/31511 déplacés vers le namespace dcCharger, gain TOU ESS Preheating corrigé
- (ssbingo) Nouveau : rétro-écriture des registres de contrôle plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10) ; registres RW lus au démarrage
- (ssbingo) Correctif : avertissements répétés ESS Preheating supprimés ; erreurs de lecture des registres de contrôle au démarrage abaissées en debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: lecture TOU préchauffage ESS (FC03, 50000–50183) et écriture implémentées; encodeValue ajouté

### 2.2.3 (2026-06-10)
- (ssbingo) fix: ajout de 25 clés i18n manquantes (PSS, PID, préchauffage ESS, registres étendus) dans les 11 langues

### 2.2.2 (2026-06-09)
- (ssbingo) docs: mise à jour de tous les READMEs pour le protocole Modbus V2.9 — ajout de PSS, PID, préchauffage ESS, registres étendus, SigenMicro

### 2.2.1 (2026-06-09)
- (ssbingo) fix : table de registres PSS corrigée à 122 entrées selon la spec officielle V2.9 (adresses, gains, types) ; registres d'écriture PSS corrigés à 6 entrées WO ; registres PID 33055-33060 corrigés (types, gains, 2 entrées manquantes)

### 2.2.0 (2026-06-09)
- (ssbingo) Fonctionnalité : prise en charge PSS (commutateur de puissance) et PID (détection d'isolation PV) ; registres de planification TOU de préchauffage ESS ; nouvelles options admin pour les ID esclaves PSS/PID

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Fonctionnalité : statistiques étendues — statistiques installation (30088–30097), charges intelligentes 1–24 (30098–30193), énergie cumulée (30194–30271), retour de régulation (30613–30619), paramètres code réseau (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Fonctionnalité : protocole Modbus V2.9 — nouveaux registres installation/onduleur/chargeur DC, registres obsolètes supprimés, énumérations étendues

### 1.9.17 (2026-06-08)
- (ssbingo) Correctif : suppression du format long i18n dupliqué (admin/i18n), ajout de la clé de traduction /dev/ttyUSB0

### 1.9.16 (2026-06-08)
- (ssbingo) Chore : devDependency @alcalzone/release-script mise à jour vers ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) Chore : ajout de @tsconfig/node22 en devDependency (mise à jour du template ioBroker)
- (ssbingo) Chore : testing-action-check mis à jour vers @v2
- (ssbingo) Chore : mise à jour de sécurité axios

### 1.9.14 (2026-05-27)
- (ssbingo) Correctif : corrections pipeline CI — Node.js 24, @types/node ^22.0.0, package-lock.json corrigé ; seule la dernière entrée dans common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Correctif : package-lock.json mis à jour pour @types/node ^22.0.0 (était verrouillé sur 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) Correctif : @types/node épinglé à ^22.0.0 dans les devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) Correctif : Node.js 24 pour les jobs CI check-and-lint et deploy
- (ssbingo) Chore : ajout de @types/node en devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Mises à jour des dépendances via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) Mises à jour CI — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Mises à jour des dépendances via Dependabot : protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Node.js >= 22 requis désormais

### 1.9.8 (2026-04-22)
- (ssbingo) Correctif : journaux d'erreurs de connexion/polling dédupliqués pour éviter l'inondation des logs et améliorer la compatibilité Sentry
- (ssbingo) Correctif : protections à l'arrêt et extendForeignObject évitent les conditions de concurrence au déchargement et avec l'UI admin
- (ssbingo) Correctif : fuite de socket corrigée sur timeout Modbus ; testConnection met maintenant le polling en pause ; canaux de contrôle vides supprimés

### 1.9.7 (2026-04-16)
- (ssbingo) Nouveau : ajout des états calculés plant.pv1Power, plant.pv2Power, plant.pv3Power
