# ioBroker Sigenergy Adaptateur

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptateur pour les systèmes d'énergie solaire Sigenergy via Modbus TCP/RTU**

Supporte le protocole Sigenergy Modbus V2.5 (publié le 2025-02-19).

---

## Fonctionnalités

- 📡 **Modbus TCP** (Ethernet / WLAN / fibre optique / 4G) — port 502
- 🔗 **Modbus RTU** (RS485 série)
- ⚡ **Support complet des registres** — tous les registres d'installation et d'onduleur selon la spécification V2.5
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

### 1.9.8 (2026-04-22)
- (ssbingo) Correctif : journaux d'erreurs de connexion/polling dédupliqués pour éviter l'inondation des logs et améliorer la compatibilité Sentry
- (ssbingo) Correctif : protections à l'arrêt et extendForeignObject évitent les conditions de concurrence au déchargement et avec l'UI admin
- (ssbingo) Correctif : fuite de socket corrigée sur timeout Modbus ; testConnection met maintenant le polling en pause ; canaux de contrôle vides supprimés

### 1.9.7 (2026-04-16)
- (ssbingo) Nouveau : ajout des états calculés plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.6 (2026-04-16)
- (ssbingo) Nouveau : ajout des états calculés plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.5 (2026-04-08)
- (ssbingo) Correction : suppression de common.schedule inutilisé dans io-package.json

### 1.9.4 (2026-04-08)
- (ssbingo) Correction : Changelog / ajout de CHANGELOG_OLD.md

### 1.9.3 (2026-04-08)
- (ssbingo) Correction : suppression de admin/index.html

### 1.9.2 (2026-04-08)
- (ssbingo) Corrections

### 1.9.1 (2026-04-08)
- (ssbingo) Interface d'administration corrigée : suppression des fichiers obsolètes index.html/index_m.html/words.js ; correction du type jsonData dans les boutons sendTo de jsonConfig

### 1.9.0 (2026-03-26)
- (ssbingo) Test terminé

### 1.8.23 (2026-03-26)
- (ssbingo) Année de copyright corrigée à 2026 dans LICENSE et README ; corrections techniques : CI/CD, linting, tests

