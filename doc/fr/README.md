# ioBroker Sigenergy Adaptateur

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptateur pour les systèmes d'énergie solaire Sigenergy via Modbus TCP/RTU**

Supporte le protocole Sigenergy Modbus V2.9 (publié le 2026-05-13).

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

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

## Coupure d'urgence — protection des systèmes photovoltaïques externes

### Contexte

Les onduleurs hybrides Sigenergy disposent d'une **passerelle de secours** optionnelle
qui bascule automatiquement en mode hors réseau / îlotage lors d'une coupure de courant.
Dans ce mode, le système Sigenergy génère son propre réseau local en courant alternatif,
alimenté par la batterie.

Si un **deuxième système photovoltaïque** — comme une centrale de balcon, un micro-onduleur
ou un onduleur de chaîne tiers — est connecté au même circuit domestique, il continue
d'injecter de l'énergie dans ce réseau local isolé. La plupart des onduleurs raccordés au
réseau ne sont pas conçus pour ce fonctionnement et peuvent :

- surcharger la gestion de la batterie Sigenergy
- déstabiliser la tension ou la fréquence du réseau en îlotage
- être endommagés par les conditions de fonctionnement inhabituelles

La seule solution sûre est la **déconnexion immédiate** du système externe
dès que Sigenergy passe en mode hors réseau.

### Fonctionnement dans l'adaptateur

L'adaptateur surveille l'état `plant.onOffGridStatus` à chaque cycle de polling.

**En cas de coupure réseau** (`onOffGridStatus` = 1 ou 2) :
- Tous les appareils d'urgence configurés sont commutés instantanément
- Une notification Telegram est envoyée (optionnel)

**En cas de retour réseau** (`onOffGridStatus` = 0) :
- Une minuterie de stabilisation configurable démarre (défaut : 10 minutes)
- Si le réseau reste stable pendant toute la durée, les appareils sont restaurés
- Si le réseau tombe à nouveau pendant la minuterie, celle-ci est annulée
  et les appareils restent coupés
- Une notification Telegram est envoyée lors de la restauration réussie (optionnel)

### Activation de la fonction

**Étape 1 — onglet Composants**  
Cocher **Passerelle de secours (commutation hors réseau)**.  
L'onglet *Coupure d'urgence* devient visible.

**Étape 2 — onglet Coupure d'urgence**

#### Appareils

| Champ | Description |
|---|---|
| **Délai de stabilisation (minutes)** | Durée pendant laquelle le réseau doit rester stable avant de remettre les appareils en marche. Recommandation : 10 minutes. |
| **Appareil 1 — ID d'objet** | L'ID d'état ioBroker du commutateur principal du système externe. Mis à `false` lors d'une coupure réseau ; `true` après une récupération stable. |
| **Appareils 2–4 — ID d'objet** | Appareils optionnels supplémentaires. |
| **Appareils 2–4 — Direction** | *ÉTEINT en cas de coupure, ALLUMÉ après récupération* ou *ALLUMÉ en cas de coupure, ÉTEINT après récupération*. |

#### Notifications Telegram (optionnel)

| Champ | Description |
|---|---|
| **Activer la notification Telegram** | Active les notifications lors des coupures et récupérations réseau. |
| **Instance Telegram** | Sélectionner l'instance de l'adaptateur `telegram.x` à utiliser. |
| **ID de chat** | Optionnel : restreindre à un chat spécifique. Laisser vide pour diffuser à tous. |

### Exemple — centrale de balcon

Un relais Shelly Plus 1 est câblé en série avec le câble d'alimentation de la centrale de balcon.
Son ID d'état ioBroker est `shelly.0.SHPLUS1-ABC123.Relay0.Switch`.

Configuration :
- **Appareil 1** : `shelly.0.SHPLUS1-ABC123.Relay0.Switch`  
  → Le relais s'ouvre (`false`) lors d'une coupure réseau, se ferme (`true`) après une récupération stable

La centrale de balcon est désormais automatiquement protégée.

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

### 3.0.5 (2026-06-14)
- (ssbingo) fix: champ license manquant ajouté au bloc common de io-package.json

### 3.0.4 (2026-06-14)
- (ssbingo) Correctif : la notification Telegram lors d'une coupure réseau n'est désormais envoyée qu'une seule fois (pas à chaque poll) ; la commutation des appareils est limitée à 3 tentatives maximum (initiale + 2 nouvelles) en mode hors réseau

### 3.0.3 (2026-06-13)
- (ssbingo) Correctif : welcomeText non fonctionnel supprimé de io-package.json ; avertissement staticText visible ajouté dans l'onglet Coupure d'urgence (encadré jaune, i18n dans les 11 langues)

### 3.0.2 (2026-06-13)
- (ssbingo) Correctif : erreurs ESLint/Prettier corrigées dans les méthodes de coupure d'urgence — variable inutilisée supprimée, indentation corrigée, types JSDoc @param ajoutés

### 3.0.1 (2026-06-13)
- (ssbingo) Nouveau : welcomeText ajouté à io-package.json — avertissement multilingue sur la fonction de coupure d'urgence

### 3.0.0 (2026-06-13)
- (ssbingo) Nouveau : coupure d'urgence — déconnexion automatique des systèmes photovoltaïques externes (centrales de balcon, micro-onduleurs) lors d'une coupure réseau ; minuterie de stabilisation configurable au retour du réseau ; notifications Telegram optionnelles
- (ssbingo) Docs : documentation de la coupure d'urgence ajoutée dans les 11 langues

### 2.5.2 (2026-06-12)
- (ssbingo) fix: encodage des espaces en %20 dans l'URL du bouton Buy Me a Coffee — l'image ne s'affichait pas sur GitHub

### 2.5.1 (2026-06-12)
- (ssbingo) fix: correction du rôle de l'instanceObject info.modelType de 'info.name' en 'text' (avertissements W1133/W1135 de l'adapter-checker)

### 2.5.0 (2026-06-12)

- (ssbingo) Sécurité d'écriture architecturale : les écritures Modbus sont rejetées directement dans le dispatcher lorsque le registre cible n'est pas valide pour le type d'appareil configuré (gating models dans onStateChange, garde plant pour SigenMicro uniquement)
- (ssbingo) Vérification TypeScript corrigée — nouveau `lib/adapter-config.d.ts` avec déclaration AdapterConfig complète, constructeur modbus-serial typé, annotations ioBroker.CommonType/SettableObject ; nouveau script `npm run check` passe sans erreur
- (ssbingo) La configuration ESLint autorise les balises JSDoc `@type` dans ce projet JavaScript vérifié (jsdoc/check-tag-names avec typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Architecture de types d'appareils : sélecteur obligatoire (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / onduleur PV uniquement / SigenMicro uniquement) avec séparation stricte des registres selon les notes du protocole V2.9
- (ssbingo) Prise en charge officielle de Sigen Hybrid et des onduleurs PV (Sigen PV / PV Max)
- (ssbingo) Détection automatique du type d'appareil depuis le matériel dans l'admin (registres 30500 / 31024)
- (ssbingo) Vérification du modèle au démarrage — avertit en cas de divergence entre configuration et matériel (nouvel état info.modelType)
- (ssbingo) Registres PV dynamiques : PV5-PV16 tension/courant selon le nombre de strings du registre 31025
- (ssbingo) Contrôle du facteur de puissance PCC (40157/40158) réservé au M1-HYB ; préchauffage ESS réservé au M1-HYB ; chargeur DC et grid code réservés à SigenStor/Sigen Hybrid
- (ssbingo) Migration automatique des configurations antérieures à 2.4.0 et nettoyage des canaux invalides pour le type d'appareil sélectionné

### 2.3.4 (2026-06-12)
- (ssbingo) fix: correction de la détection du niveau de protocole — quantités de registres correctes pour les sondes, ordre décroissant V2.9→V2.6, distinction des erreurs de transport des exceptions du périphérique pour éviter un rapport pre-V2.6 erroné

### 2.3.3 (2026-06-11)
- (ssbingo) fix: supprimer les avertissements répétés de lecture de registres après la première occurrence pour plant/inverter/acCharger/dcCharger/pss/pid ; les échecs suivants sont journalisés au niveau debug uniquement

### 2.3.2 (2026-06-10)
- (ssbingo) fix: afficher 'pre-V2.6' au lieu de 'unknown' si l'appareil répond mais n'a pas de registres plant étendus ; log de débogage par sonde avec message d'exception Modbus

### 2.3.1 (2026-06-10)
- (ssbingo) feat: détection du niveau de protocole Modbus au démarrage en sondant les registres 30088/30200/30228/30286 ; lecture de la version firmware (30525) ; journalisation du résultat et stockage dans l'état info.protocolLevel

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
