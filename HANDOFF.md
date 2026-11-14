# 🤝 Handoff Document — Tournoi du Bowling Limoges Nord

Ce document sert de passation de pouvoir entre agents IA (ou développeurs) pour le projet **Tournoi du Bowling**. Il résume l'état actuel, l'architecture, les règles métier et la feuille de route.

---

## 📋 1. Contexte du Projet
Application web de gestion de **tournoi de fléchettes individuel**.
- **Lieu** : Bowling Limoges Nord.
- **Thème visuel** : Sombre, ambiance bowling avec des accents néon cyan (`#00f3ff`) et rose (`#ff007a`).
- **Public** : Organisation sur tablette (organisateurs) et mobile (joueurs via QR Code).

## 🏗️ 2. Stack Technique & État Actuel

Le projet est une **application React moderne** construite avec :
- **React 18** + **TypeScript** (fichiers `.tsx`).
- **Vite** pour le bundling et le serveur de développement.
- **Tailwind CSS** pour le style.
- **Zustand** pour la gestion de l'état global.
- **React Router DOM** pour la navigation.
- **Supabase** (PostgreSQL + Realtime) pour la synchronisation multi-appareils.
- **qrcode.react** pour la génération des QR codes.
- **Vercel** pour l'hébergement en production.

### Ce qui est FAIT (et fonctionnel) :
- [x] Architecture modulaire (pages, composants, store, utils, lib).
- [x] Gestion des joueurs (ajout, suppression, réordonnancement avec numérotation).
- [x] Paramétrage complet (format des poules, legs, cibles dynamiques).
- [x] Génération des poules et de la phase finale (croisement inter-poules, gestion des BYE).
- [x] **Match pour la 3ème place (Petite Finale)** généré automatiquement (uniquement pour le tableau principal).
- [x] **Synchronisation Supabase Realtime** : Les scores saisis sur mobile remontent sur la tablette.
- [x] **Système de QR Codes** : Génération par poule pour la saisie des scores sur mobile.
- [x] **Attribution de cible bidirectionnelle** : On peut assigner un match à une cible depuis l'onglet "Cibles" OU directement depuis l'arbre de la "Phase Finale" (via un menu déroulant). La cible se libère automatiquement une fois le score saisi.
- [x] Classement général (Points, Différentiel, Legs).
- [x] Mode Démo (19 joueurs avec scores pré-remplis) pour les tests/vidéos.

---

## ⚠️ 3. RÈGLES MÉTIER CRITIQUES

1. **Tournoi individuel** : On parle de "Joueurs", jamais d'"Équipes" ou de "Doublettes".
2. **Aucun match nul** : Aux fléchettes, on ne fait pas de nul. Si un score identique est saisi, il est bloqué.
3. **Numérotation des joueurs** : Le numéro (`#1`, `#2`...) est **dérivé de l'index** du joueur dans le tableau `teams`.
4. **Croisement Inter-Poules** : En phase finale, le 1er d'une poule affronte le 2e d'une autre poule.
5. **Cibles dynamiques** : On peut ajouter/supprimer/renommer des cibles (par défaut 6 cibles, nommées "1", "2", etc.).
6. **Troisième place** : Un match de "Petite Finale" est généré uniquement pour le tableau principal pour déterminer le 3ème.

---

## 📁 4. Structure des Fichiers (À JOUR)

```text
tournoi-bowling/
├── vercel.json            # Configuration du routeur Vercel (rewrites)
├── HANDOFF.md             # Ce document
├── src/
│   ├── main.tsx           # Point d'entrée
│   ├── App.tsx            # Routeur principal (inclut /score/:poolId hors Layout)
│   ├── index.css          # Tailwind + classes utilitaires
│   ├── types.ts           # Interfaces TS (Team, Pool, Match, Bracket, Target, TournamentState)
│   ├── lib/
│   │   └── supabase.ts    # Client Supabase (URL + ANON KEY)
│   ├── store/
│   │   └── useTournamentStore.ts # Zustand store (actions, state, sync Supabase Realtime)
│   ├── utils/
│   │   └── tournamentLogic.ts # Fonctions pures (standings, seeds, rebuildBracket avec 3ème place)
│   ├── components/
│   │   ├── Layout.tsx     # Wrapper (Navbar + Outlet)
│   │   ├── Navbar.tsx     # Header
│   │   ├── Button.tsx     # Bouton réutilisable
│   │   └── ScoreInput.tsx # Saisie de score robuste
│   └── pages/
│       ├── HomePage.tsx       # Dashboard + Bouton Démo
│       ├── InscriptionsPage.tsx # Gestion des joueurs
│       ├── SettingsPage.tsx   # Paramétrage complet
│       ├── PoolsPage.tsx      # Affichage des poules + Bouton QR Codes
│       ├── FinalsPage.tsx     # Arbre de tournoi + Petite Finale + Podium + Assignation Cibles
│       ├── TargetsPage.tsx    # Attribution des cibles
│       ├── StatsPage.tsx      # Classement général
│       └── ScoreEntryPage.tsx # Page mobile accessible via QR Code

    🛠️ 5. Configuration Supabase (Crucial)

L'application fonctionne en réseau grâce à Supabase.
Script SQL exécuté
create table if not exists tournament_sync (
  id text primary key default 'current_tournament',
  state jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter publication supabase_realtime add table tournament_sync;
alter table tournament_sync enable row level security;

create policy "Enable read access for all" on tournament_sync for select using (true);
create policy "Enable insert/update for all" on tournament_sync for all using (true) with check (true);

Logique du Store

    syncToSupabase() pousse l'état complet vers la table tournament_sync.

    fetchInitialState() récupère les données au démarrage (utilise .maybeSingle() pour éviter l'erreur "cannot coerce").

    Un écouteur supabase.channel met à jour le store en temps réel si un autre appareil modifie les données.
    La fonction commitScore libère automatiquement la cible associée au match si un score est validé.

    🚀 6. Commandes et Déploiement
    # Installation
npm install

# Développement (test local)
npm run dev

# Déploiement en production (Vercel)
vercel --prod

⚠️ Toujours lancer npm run build en local avant de déployer pour s'assurer qu'il n'y a pas d'erreurs TypeScript (comme les variables non utilisées) qui feraient échouer le build sur Vercel.

    💡 7. Pistes d'amélioration futures

□

Sécurisation : Ajouter un code PIN pour empêcher les joueurs d'accéder aux onglets d'administration (actuellement, s'ils modifient l'URL, ils peuvent voir l'interface organisateur).
□

Affichage TV : Un mode "Plein écran" pour projeter les tableaux et le classement sur un grand écran.
□

Validation des scores : Si un joueur se trompe en saisissant son score, prévoir un bouton "Signaler une erreur" sur mobile.