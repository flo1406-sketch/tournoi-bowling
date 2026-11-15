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
- **Vite** pour le bundling.
- **Tailwind CSS** pour le style.
- **Zustand** pour la gestion de l'état global.
- **React Router DOM** pour la navigation.
- **Supabase** (PostgreSQL + Realtime) pour la synchronisation multi-appareils.
- **qrcode.react** pour générer les QR codes joueurs.
- **Vercel** pour l'hébergement en production.

### Ce qui est FAIT (et fonctionnel) :
- [x] Architecture modulaire.
- [x] Gestion des joueurs, génération des poules et des tableaux finaux.
- [x] **Match pour la 3ème place (Petite Finale)** généré pour le tableau principal.
- [x] **Synchronisation Supabase Realtime** : Scores saisis sur mobile = mise à jour instantanée sur la tablette.
- [x] **Système de QR Codes** : Génération par poule ET par match de phase finale.
- [x] **Vue "Contrôle Cibles" (Poules & Finales)** : Une vue optimisée pour la projection (rétroprojecteur) avec des colonnes par cible, la file d'attente et les QR codes intégrés.
- [x] **Algorithme d'affectation équitable (Régulateur)** : Assigne les matchs aux cibles pour que toutes les poules se terminent en même temps (priorité aux poules en retard). Évite de faire jouer les mêmes joueurs d'affilée.
- [x] **Affectation automatique** : Dès qu'un match se termine, le prochain match de la poule est placé sur la cible libérée si les joueurs sont disponibles.
- [x] **Saisie des scores en ligne** : Les scores sont sur la même ligne que les noms dans les arbres de tournoi, avec un bouton "Valider".
- [x] **Reset des scores** : Utilisation de `key={match.id}` sur `ScoreInput` pour éviter que les scores du match précédent restent affichés.

---

## ⚠️ 3. RÈGLES MÉTIER CRITIQUES

1. **Tournoi individuel** : On parle de "Joueurs", jamais d'"Équipes" ou de "Doublettes".
2. **Aucun match nul** : Aux fléchettes, on ne fait pas de nul. Le score identique est bloqué.
3. **Numérotation des joueurs** : Le numéro (`#1`, `#2`...) est **dérivé de l'index** du joueur dans le tableau `teams`.
4. **Croisement Inter-Poules** : En phase finale, le 1er d'une poule affronte le 2e d'une autre poule.
5. **Cibles dynamiques** : On peut ajouter/supprimer/renommer des cibles. Chaque cible peut avoir une "Poule par défaut".
6. **Troisième place** : Un match de "Petite Finale" est généré uniquement pour le tableau principal.
7. **Régulation (Contrôle Cibles)** : L'algorithme d'affectation cherche toujours à équilibrer la progression des poules et à maximiser le temps de repos des joueurs.

---

## 📁 4. Structure des Fichiers

```text
tournoi-bowling/
├── vercel.json            # Configuration du routeur Vercel (rewrites)
├── HANDOFF.md             # Ce document
├── src/
│   ├── main.tsx           # Point d'entrée
│   ├── App.tsx            # Routeur principal (inclut /score/:poolId et /score/final/:matchId)
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
│       ├── HomePage.tsx           # Dashboard + Bouton Démo
│       ├── InscriptionsPage.tsx   # Gestion des joueurs
│       ├── SettingsPage.tsx       # Paramétrage complet
│       ├── PoolsPage.tsx          # Affichage des poules (bascule Classique / Contrôle Cibles)
│       ├── PoolControlRoom.tsx    # Vue colonnes pour les cibles de poules
│       ├── FinalsPage.tsx         # Arbre de tournoi (bascule Arbre / Contrôle Cibles)
│       ├── FinalControlRoom.tsx   # Vue colonnes pour les cibles de finales
│       ├── TargetsPage.tsx        # Attribution classique des cibles
│       ├── StatsPage.tsx          # Classement général
│       ├── ScoreEntryPage.tsx     # Saisie mobile via QR Code (Poules)
│       └── ScoreEntryFinalPage.tsx # Saisie mobile via QR Code (Finales)

🛠️ 5. Configuration Supabase (Crucial)

L'application fonctionne en réseau grâce à Supabase.
Script SQL (à exécuter dans Supabase)

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

    Un écouteur supabase.channel met à jour le store en temps réel.

    La fonction commitScore libère automatiquement la cible et cherche le prochain match de la poule (avec logique anti-matchs d'affilée).

    🚀 6. Commandes utiles et Déploiement

    # Installation
npm install

# Développement local
npm run dev

# ⚠️ TRÈS IMPORTANT : Tester le build avant de déployer
npm run build

# Déploiement en production (Vercel CLI)
vercel --prod

Note sur les QR codes : En local (localhost), les QR codes ne fonctionnent pas sur téléphone. Il faut tester via l'URL de production Vercel.

💡 7. Pistes d'amélioration futures

    □

    Sécurisation : Ajouter un code PIN pour empêcher les joueurs d'accéder aux onglets d'administration (actuellement, s'ils modifient l'URL, ils peuvent voir l'interface organisateur).
    □

    Mode TV : Un mode "Plein écran" (déjà partiellement géré par la vue Contrôle) pour projeter les tableaux et le classement sur un grand écran.
    □

    Validation des scores : Si un joueur se trompe en saisissant son score, prévoir un bouton "Signaler une erreur" sur mobile.