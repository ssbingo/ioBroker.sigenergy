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

## Installation

### Via ioBroker Admin (recommandé)
1. Ouvrir ioBroker Admin → Adaptateurs
2. Rechercher « sigenergy »
3. Installer

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

## Licence

Licence MIT — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.5.1 (2026-03-16)
* Bouton de scan SigenMicro ajouté directement dans l'onglet jsonConfig; les appareils trouvés sont enregistrés automatiquement

### 1.5.0 (2026-03-16)
* Onglet SigenMicro: bouton de scan visible, barre de progression en temps réel avec plage d'ID et compteur de dispositifs

### 1.4.1 (2026-03-16)
* Support SigenMicro: scan Modbus, découverte des appareils, activation individuelle, onglet dédié

### 1.4.0 (2026-03-14)
* Corrections / Nettoyage

### 1.3.19 (2026-03-14)
* Retour eslint/@eslint/js à 9.x; serialport mis à jour vers 13.0.0

### 1.3.18 (2026-03-14)
* Mise à jour eslint 10.0.3, @eslint/js 10.0.1, serialport 13.0.0

### 1.3.17 (2026-03-13)
* Mocha supprimé des devDependencies

### 1.3.16 (2026-03-13)
* Dépendance mocha restaurée, script test:package corrigé

### 1.3.15 (2026-03-13)
* Correction indentation setTimeout dans testConnection

### 1.3.14 (2026-03-13)
* Correction des deux dernières erreurs de lint

### 1.3.13 (2026-03-13)
* Tous les erreurs ESLint/Prettier corrigées: JSDoc, formatage, imports inutilisés

### 1.3.12 (2026-03-13)
* Correction régression curly dans modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Correction Prettier: virgules finales manquantes dans registers.js

### 1.3.10 (2026-03-13)
* Correction Prettier: objets de registre développés en format multiligne

### 1.3.9 (2026-03-13)
* Ajout de la documentation dans README.md - multilingue

### 1.3.8 (2026-03-13)
* Ajout des traductions uk/zh-cn manquantes

### 1.3.7 (2026-03-13)
* Suppression de la dépendance mocha redondante

### 1.3.6 (2026-03-13)
* Correction du formatage Prettier/ESLint

### 1.3.5 (2026-03-13)
* (ssbingo) Correction CI : utilisation du chemin binaire explicite de mocha pour éviter les problèmes de résolution PATH avec npm ci

### 1.3.4 (2026-03-13)
* (ssbingo) Correction CI : mocha ajouté aux devDependencies pour permettre l'exécution du script test:package

### 1.3.3 (2026-03-13)
* (ssbingo) Correction de l'avertissement JSDoc @param en double causé par une balise fermante manquante dans modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Corrections qualité du code : variables inutilisées supprimées, documentation JSDoc complétée, déclaration lexicale dans switch-case corrigée

### 1.3.0 (2026-03-13)
* (ssbingo) Documentation multilingue mise à jour

### 1.2.5 (2026-03-12)
* (ssbingo) Corrections

### 1.2.4 (2026-03-12)
* (ssbingo) Ajout de la documentation multilingue dans README.md

### 1.2.3 (2026-03-12)
* (ssbingo) Corrections pour AdapterCheck

### 1.2.2 (2026-03-11)
* (ssbingo) Corrections

### 1.2.1 (2026-03-11)
* (ssbingo) Corrections

### 1.2.0 (2026-03-11)
* (ssbingo) StatisticsCalculator mis à jour : ré-ajout des estimations de temps de batterie, temps de charge journalier et suivi de la couverture batterie

### 1.1.9 (2026-03-11)
* (ssbingo) StatisticsCalculator remplacé par une version améliorée : puissance domestique lissée, formules d'autarcie/autoconsommation corrigées

### 1.1.8 (2026-03-11)
* (ssbingo) Informations auteur corrigées dans package.json ; entrées de news nettoyées dans io-package.json

### 1.1.7 (2026-03-11)
* (ssbingo) Logging amélioré : messages debug/info/warn/error pour le cycle de vie de la connexion, les cycles de polling, les lectures de registres et l'arrêt de l'adaptateur

### 1.1.0 (2026-03-09)
* (ssbingo) Interface d'administration migrée de l'HTML legacy vers jsonConfig (Admin 5+)

### 0.1.0 (2026-03-01)
* (ssbingo) Première version — support Modbus TCP/RTU pour les systèmes Sigenergy

---

## Documentation

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
