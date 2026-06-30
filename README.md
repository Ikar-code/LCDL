# LCDL

> **LCDL (Le Capital du Lord)** est un système d'analyse et de trading assisté par intelligence artificielle dédié aux marchés des cryptomonnaies.

Le projet a pour objectif de développer un agent autonome capable d'analyser les marchés crypto en temps réel, d'évaluer les opportunités d'investissement et, à terme, d'exécuter automatiquement des ordres d'achat et de vente selon une stratégie définie.

## Vision

LCDL n'est pas conçu comme un simple bot de trading basé sur quelques indicateurs techniques.

L'objectif est de construire un véritable système décisionnel capable de :

* analyser les données du marché en temps réel ;
* interpréter les actualités et événements influençant les cryptomonnaies ;
* adapter sa stratégie selon le contexte du marché ;
* gérer plusieurs horizons d'investissement (court terme et long terme) ;
* expliquer les décisions prises avant chaque opération.

Avant toute utilisation avec des fonds réels, le système sera développé et validé dans un environnement de simulation reproduisant fidèlement les conditions du marché.

## Fonctionnalités prévues

* Analyse temps réel des marchés crypto.
* Surveillance simultanée de plusieurs actifs.
* Analyse des actualités et du sentiment du marché.
* Détection automatique des opportunités.
* Gestion du risque.
* Suivi du portefeuille.
* Historique complet des décisions.
* Tableau de bord interactif.
* Simulation de trading avant utilisation réelle.
* Exécution automatique des ordres (phase finale du projet).

## Technologies

### Frontend

* React
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* TypeScript

### Intelligence artificielle

* Gemini API
* Agents IA spécialisés

### Données

* APIs de marché crypto
* Flux d'actualités
* Analyse de sentiment

### Base de données

* Supabase

## Architecture prévue

```text
Frontend
        │
        ▼
Backend API
        │
        ├── Agent Analyse Marché
        ├── Agent Actualités
        ├── Agent Décision
        ├── Agent Gestion du risque
        └── Agent Exécution
                │
                ▼
      Exchange Crypto API
```

## Feuille de route

### Phase 1

* Interface utilisateur
* Connexion aux APIs de marché
* Visualisation temps réel
* Portefeuille virtuel

### Phase 2

* Agent d'analyse
* Simulation des achats et ventes
* Journal des décisions
* Backtesting

### Phase 3

* Analyse des actualités
* Analyse du sentiment
* Gestion du risque
* Optimisation de la stratégie

### Phase 4

* Trading automatisé
* Exécution des ordres
* Gestion du portefeuille réel
* Surveillance continue

## Avertissement

LCDL est actuellement un projet personnel en cours de développement.

Aucune fonctionnalité de trading réel ne sera utilisée avant une phase complète de simulation, de validation et de tests approfondis.

---

Développé par **Lucas Rajany**.
