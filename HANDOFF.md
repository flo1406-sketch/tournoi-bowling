# 🤝 Handoff Document — Tournoi du Bowling Limoges Nord

Ce document sert de passation de pouvoir entre agents IA (ou développeurs) pour le projet **Tournoi du Bowling**. Il résume l'état actuel, l'architecture, les règles métier et la feuille de route.

---

## 📋 1. Contexte du Projet
Application web de gestion de **tournoi de fléchettes individuel** (et non en doublettes).
- **Lieu** : Bowling Limoges Nord.
- **Thème visuel** : Sombre, ambiance bowling avec des accents néon cyan (`#00f3ff`) et rose (`#ff007a`).
- **Public** : Organisation sur tablette (pour les organisateurs) et mobile (pour les joueurs).

## 🏗️ 2. Stack Technique & État Actuel

Le projet est une **application React moderne** construite avec :
- **React 18** + **TypeScript** (fichiers `.tsx`).
- **Vite** pour le bundling et le serveur de développement.
- **Tailwind CSS** pour le style (configuré avec des couleurs custom `bowling-dark`, `bowling-neon`, etc.).
- **Zustand** pour la gestion de l'état global (avec middleware `persist` pour le `localStorage`).
- **React Router DOM** pour la navigation entre les pages.
- **Supabase** pour la base de données temps réel et la synchronisation multi-appareils.
- **qrcode.react** pour la génération des QR Codes.

### Ce qui est FAIT (et fonctionnel) :
- [x] Architecture modulaire (pages, composants, store, utils).
- [x] Gestion des joueurs (ajout, suppression, réordonnancement).
- [x] Paramétrage complet (format des poules, legs, cibles).
- [x] Génération des poules et de la phase finale (croisement inter-poules, gestion des BYE).
- [x] Saisie des scores (poules, tableaux, cibles) avec le composant robuste `ScoreInput`.
- [x] **Match pour la 3ème place (Petite Finale)** généré automatiquement si les demi-finales sont terminées.
- [x] **Synchronisation Supabase** : Les scores saisis sur mobile remontent instantanément sur la tablette de l'organisateur.
- [x] **Système de QR Codes** : Génération de QR codes par poule pour que les joueurs saisissent leurs propres scores.
- [x] Classement général (Points, Différentiel, Legs).

---

## ⚠️ 3. RÈGLES MÉTIER CRITIQUES

1. **Tournoi individuel** : On parle de "Joueurs", jamais d'"Équipes" ou de "Doublettes".
2. **Aucun match nul** : Aux fléchettes, on ne fait pas de nul. Si un score identique est saisi, il doit être bloqué.
3. **Numérotation des joueurs** : Le numéro (`#1`, `#2`...) est **dérivé de l'index** du joueur dans le tableau `teams`.
4. **Croisement Inter-Poules** : En phase finale, le 1er d'une poule affronte le 2e d'une autre poule.
5. **Cibles dynamiques** : On peut ajouter/supprimer/renommer des cibles (par défaut 6 cibles).
6. **Troisième place** : Les deux perdants des demi-finales s'affrontent dans un **match dédié (Petite Finale)** pour déterminer le vainqueur de la 3ème place. Pas de calcul mathématique complexe.

---

## 📁 4. Structure des Fichiers

```text
src/
├── main.tsx               # Point d'entrée
├── App.tsx                # Routeur principal (inclut la route /score/:poolId hors Layout)
├── index.css              # Tailwind + classes utilitaires
├── types.ts               # Interfaces TS (Team, Pool, Match, Bracket, Target, TournamentState)
├── lib/
│   └── supabase.ts        # Client Supabase (URL + ANON KEY)
├── store/
│   └── useTournamentStore.ts # Zustand store complet (actions, state, sync Supabase)
├── utils/
│   └── tournamentLogic.ts # Fonctions pures (standings, seeds, rebuildBracket avec 3ème place)
├── components/
│   ├── Layout.tsx         # Wrapper (Navbar + Outlet)
│   ├── Navbar.tsx         # Header
│   ├── Button.tsx         # Bouton réutilisable
│   └── ScoreInput.tsx     # Saisie de score robuste (avec Supabase sync)
└── pages/
    ├── HomePage.tsx       # Dashboard
    ├── InscriptionsPage.tsx # Gestion des joueurs
    ├── SettingsPage.tsx   # Paramétrage complet
    ├── PoolsPage.tsx      # Affichage des poules + Bouton QR Codes
    ├── FinalsPage.tsx     # Arbre de tournoi + Petite Finale + Podium
    ├── TargetsPage.tsx    # Attribution des cibles
    ├── StatsPage.tsx      # Classement général
    └── ScoreEntryPage.tsx # Page mobile accessible via QR Code
    