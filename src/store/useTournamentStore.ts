import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TournamentState, Pool, Match, Bracket, Target } from '../types';
import { 
  nextPow2, STANDARD_SEEDS, rebuildBracket, 
  computeAutoSplit, buildPoolAwareSlots, computeGlobalStats 
} from '../utils/tournamentLogic';
import { supabase } from '../lib/supabase';

const createTarget = (num: number): Target => ({
  id: `target-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  label: String(num),
  matchId: null
});

const DEFAULT_CONFIG = {
  poolSize: 4,
  qualifyCount: 2,
  legsToWinPool: 3,
  legsToWinMain: 5,
  legsToWinCons: 3,
  targetCount: 6
};

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => {
      // Fonction pour pousser l'état vers Supabase
      const syncToSupabase = async () => {
        const state = get();
        const dataToSync = {
          teams: state.teams, pools: state.pools, poolMatches: state.poolMatches,
          mainBracket: state.mainBracket, consBracket: state.consBracket,
          targets: state.targets, config: state.config, manualQualification: state.manualQualification
        };
        await supabase.from('tournament_sync').upsert({ id: 'current_tournament', state: dataToSync });
      };

      // Écouteur pour recevoir les modifications depuis Supabase
      supabase.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_sync' }, (payload: any) => {
          if (payload.new && payload.new.state) {
            set((state) => ({ ...state, ...payload.new.state }));
          }
        })
        .subscribe();

      return {
        teams: [],
        pools: [],
        poolMatches: [],
        mainBracket: null,
        consBracket: null,
        targets: [1, 2, 3, 4, 5, 6].map(createTarget),
        config: { ...DEFAULT_CONFIG },
        manualQualification: {},

        addTeam: (name) => {
          set((state) => ({ teams: [...state.teams, { id: crypto.randomUUID(), name: name.trim() }] }));
          syncToSupabase();
        },

        removeTeam: (id) => {
          set((state) => ({
            teams: state.teams.filter(t => t.id !== id),
            pools: state.pools.map(p => ({ ...p, teamIds: p.teamIds.filter(tid => tid !== id) })),
            poolMatches: state.poolMatches.filter(m => m.a !== id && m.b !== id)
          }));
          syncToSupabase();
        },

        moveTeam: (id, dir) => {
          set((state) => {
            const idx = state.teams.findIndex(t => t.id === id);
            const newIdx = idx + dir;
            if (idx < 0 || newIdx < 0 || newIdx >= state.teams.length) return state;
            const newTeams = [...state.teams];
            [newTeams[idx], newTeams[newIdx]] = [newTeams[newIdx], newTeams[idx]];
            return { teams: newTeams };
          });
          syncToSupabase();
        },

        setTeamNumber: (id, num) => {
          set((state) => {
            const fromIdx = state.teams.findIndex(t => t.id === id);
            const toIdx = Math.max(0, Math.min(state.teams.length - 1, num - 1));
            if (fromIdx === toIdx || fromIdx < 0) return state;
            const newTeams = [...state.teams];
            const [team] = newTeams.splice(fromIdx, 1);
            newTeams.splice(toIdx, 0, team);
            return { teams: newTeams };
          });
          syncToSupabase();
        },

        setConfig: (key, value) => {
          set((state) => ({ config: { ...state.config, [key]: value } }));
          syncToSupabase();
        },

        setManualQualification: (teamId, target) => {
          set((state) => {
            const newMQ = { ...state.manualQualification };
            if (target) newMQ[teamId] = target;
            else delete newMQ[teamId];
            return { manualQualification: newMQ };
          });
          syncToSupabase();
        },

        movePlayerToPool: (playerId, targetPoolId) => {
          set((state) => {
            let sourcePoolId: string | null = null;
            const newPools = state.pools.map(p => {
              if (p.teamIds.includes(playerId)) {
                sourcePoolId = p.id;
                return { ...p, teamIds: p.teamIds.filter(id => id !== playerId) };
              }
              return p;
            });
            if (targetPoolId) {
              const targetPool = newPools.find(p => p.id === targetPoolId);
              if (targetPool) targetPool.teamIds.push(playerId);
            }
            const affectedPoolIds = [sourcePoolId, targetPoolId].filter(Boolean) as string[];
            const newMatches = state.poolMatches.filter(m => !affectedPoolIds.includes(m.poolId!));
            newPools.filter(p => affectedPoolIds.includes(p.id)).forEach(p => {
              const pi = newPools.indexOf(p);
              for (let i = 0; i < p.teamIds.length; i++) {
                for (let j = i + 1; j < p.teamIds.length; j++) {
                  newMatches.push({
                    id: `pm-${pi}-${i}-${j}-${Date.now()}`,
                    poolId: p.id, a: p.teamIds[i], b: p.teamIds[j],
                    sa: null, sb: null, done: false
                  });
                }
              }
            });
            return { pools: newPools, poolMatches: newMatches };
          });
          syncToSupabase();
        },

        addTarget: () => {
          set((state) => {
            const newNum = state.targets.length + 1;
            return { 
              targets: [...state.targets, createTarget(newNum)],
              config: { ...state.config, targetCount: state.targets.length + 1 }
            };
          });
          syncToSupabase();
        },

        removeTarget: (id) => {
          set((state) => ({
            targets: state.targets.filter(t => t.id !== id),
            config: { ...state.config, targetCount: state.targets.length - 1 }
          }));
          syncToSupabase();
        },

        updateTargetLabel: (id, label) => {
          set((state) => ({ targets: state.targets.map(t => t.id === id ? { ...t, label } : t) }));
          syncToSupabase();
        },

        assignTarget: (targetId, matchId) => {
          set((state) => ({
            targets: state.targets.map(t => {
              if (t.id === targetId) return { ...t, matchId };
              if (matchId && t.matchId === matchId) return { ...t, matchId: null };
              return t;
            })
          }));
          syncToSupabase();
        },

        generatePools: () => {
          const { teams, config } = get();
          if (teams.length < 4) return;

          const cible = Math.max(3, Math.min(6, config.poolSize));
          let count = Math.max(1, Math.round(teams.length / cible));
          while (count > 1 && Math.floor(teams.length / count) < 3) count--;

          const shuffled = [...teams].sort(() => Math.random() - 0.5);
          const newPools: Pool[] = Array.from({ length: count }, (_, i) => ({
            id: `pool${i}`, name: `Poule ${String.fromCharCode(65 + i)}`, teamIds: []
          }));
          shuffled.forEach((t, i) => newPools[i % count].teamIds.push(t.id));

          const newMatches: Match[] = [];
          newPools.forEach((p, pi) => {
            for (let i = 0; i < p.teamIds.length; i++) {
              for (let j = i + 1; j < p.teamIds.length; j++) {
                newMatches.push({
                  id: `pm-${pi}-${i}-${j}`, poolId: p.id,
                  a: p.teamIds[i], b: p.teamIds[j], sa: null, sb: null, done: false
                });
              }
            }
          });

          set({ pools: newPools, poolMatches: newMatches, mainBracket: null, consBracket: null, manualQualification: {} });
          syncToSupabase();
        },

        generateFinals: () => {
          const { pools, poolMatches, teams, config, manualQualification, targets } = get();
          if (!pools.length) return;

          const auto = computeAutoSplit(pools, poolMatches, teams, config.qualifyCount);
          const qualifies: string[] = [], consolante: string[] = [];
          
          [...auto.qualifies, ...auto.consolante].forEach(id => {
            const ov = manualQualification[id];
            if (ov === 'main') qualifies.push(id);
            else if (ov === 'cons') consolante.push(id);
            else if (auto.qualifies.includes(id)) qualifies.push(id);
            else consolante.push(id);
          });

          const buildBracket = (teamIds: string[], prefix: string, name: string): Bracket | null => {
            if (teamIds.length < 2) return null;
            const size = nextPow2(teamIds.length);
            const seeds = STANDARD_SEEDS[size] || [];
            const slots = pools.length >= 2 
              ? buildPoolAwareSlots(teamIds, size, seeds, pools, poolMatches, teams)
              : teamIds.concat(new Array(size - teamIds.length).fill(null));
            return rebuildBracket({ name, prefix, size, slots, scores: {}, rounds: [] });
          };

          set({ 
            mainBracket: buildBracket(qualifies, 'main', 'Tableau principal'), 
            consBracket: buildBracket(consolante, 'cons', 'Consolante'), 
            targets: targets.map(t => ({ ...t, matchId: null })) 
          });
          syncToSupabase();
        },

        swapBracketSlots: (brKey, idxA, idxB) => {
          set((state) => {
            const bracket = brKey === 'main' ? state.mainBracket : state.consBracket;
            if (!bracket) return state;
            const newSlots = [...bracket.slots];
            [newSlots[idxA], newSlots[idxB]] = [newSlots[idxB], newSlots[idxA]];
            const newBracket = rebuildBracket({ ...bracket, slots: newSlots });
            return brKey === 'main' ? { mainBracket: newBracket } : { consBracket: newBracket };
          });
          syncToSupabase();
        },

        commitScore: (matchId, sa, sb) => {
          if (sa === sb) return;
          set((state) => {
            const newPoolMatches = state.poolMatches.map(m => m.id === matchId ? { ...m, sa, sb, done: true } : m);
            if (newPoolMatches.some(m => m.id === matchId)) return { poolMatches: newPoolMatches };

            const updateBracket = (br: Bracket | null) => {
              if (!br) return null;
              const scores = { ...br.scores, [matchId]: { sa, sb } };
              return rebuildBracket({ ...br, scores });
            };
            return { mainBracket: updateBracket(state.mainBracket), consBracket: updateBracket(state.consBracket) };
          });
          syncToSupabase();
        },

        clearMatch: (matchId) => {
          set((state) => {
            const newPoolMatches = state.poolMatches.map(m => m.id === matchId ? { ...m, sa: null, sb: null, done: false } : m);
            if (state.poolMatches.some(m => m.id === matchId)) return { poolMatches: newPoolMatches };

            const clearBracket = (br: Bracket | null) => {
              if (!br) return null;
              const scores = { ...br.scores };
              delete scores[matchId];
              return rebuildBracket({ ...br, scores });
            };
            return {
              mainBracket: clearBracket(state.mainBracket), consBracket: clearBracket(state.consBracket),
              targets: state.targets.map(t => t.matchId === matchId ? { ...t, matchId: null } : t)
            };
          });
          syncToSupabase();
        },

        getGlobalStats: () => {
          const { teams, poolMatches, mainBracket, consBracket } = get();
          return computeGlobalStats(teams, poolMatches, mainBracket, consBracket);
        },

        generateDemo: () => {
          const state = get();
          const firstNames = [
            "Mathieu", "Bruno", "Popo", "Lili", "Mathis", "Gigi", "Flo", "Jean", 
            "Paul", "Marc", "Sophie", "Julie", "Antoine", "Lucie", "Nico", "Sarah",
            "Emma", "Lucas", "Chloé", "Hugo", "Léa", "Nathan", "Manon", "Théo"
          ];
          
          const shuffledNames = [...firstNames].sort(() => 0.5 - Math.random()).slice(0, 19);
          const demoTeams = shuffledNames.map(name => ({ id: crypto.randomUUID(), name }));
          
          const config = { ...state.config, poolSize: 4 }; 
          
          const shuffledTeams = [...demoTeams].sort(() => Math.random() - 0.5);
          const newPools: Pool[] = Array.from({ length: 5 }, (_, i) => ({
            id: `pool${i}`,
            name: `Poule ${String.fromCharCode(65 + i)}`,
            teamIds: []
          }));
          
          shuffledTeams.forEach((t, i) => {
            const poolIndex = Math.min(Math.floor(i / 4), 4); 
            newPools[poolIndex].teamIds.push(t.id);
          });

          const newMatches: Match[] = [];
          newPools.forEach((p, pi) => {
            for (let i = 0; i < p.teamIds.length; i++) {
              for (let j = i + 1; j < p.teamIds.length; j++) {
                newMatches.push({
                  id: `pm-${pi}-${i}-${j}`,
                  poolId: p.id,
                  a: p.teamIds[i],
                  b: p.teamIds[j],
                  sa: null, sb: null, done: false
                });
              }
            }
          });

          newMatches.forEach(m => {
            if (Math.random() < 0.9) {
              m.done = true;
              const maxScore = config.legsToWinPool || 3; 
              const loserScore = Math.floor(Math.random() * maxScore);
              
              if (Math.random() > 0.5) {
                m.sa = maxScore;
                m.sb = loserScore;
              } else {
                m.sa = loserScore;
                m.sb = maxScore;
              }
            }
          });

          const newTargets = [1, 2, 3, 4, 5, 6].map(createTarget);

          set({
            teams: demoTeams,
            pools: newPools,
            poolMatches: newMatches,
            config: { ...config, targetCount: 6 },
            mainBracket: null,
            consBracket: null,
            manualQualification: {},
            targets: newTargets
          });

          const dataToSync = {
            teams: demoTeams, pools: newPools, poolMatches: newMatches,
            mainBracket: null, consBracket: null,
            targets: newTargets, config: { ...config, targetCount: 6 }, manualQualification: {}
          };
          supabase.from('tournament_sync').upsert({ id: 'current_tournament', state: dataToSync });
        },

        resetTournament: () => {
          set({
            teams: [], pools: [], poolMatches: [], mainBracket: null, consBracket: null,
            targets: [1, 2, 3, 4, 5, 6].map(createTarget),
            config: { ...DEFAULT_CONFIG }, manualQualification: {}
          });
          syncToSupabase();
        }
      };
    },
    { name: 'tournoi-bowling-storage' }
  )
);