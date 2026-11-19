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
  matchId: null,
  defaultPoolId: null
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
      const syncToSupabase = async () => {
        const state = get();
        const dataToSync = {
          teams: state.teams, pools: state.pools, poolMatches: state.poolMatches,
          mainBracket: state.mainBracket, consBracket: state.consBracket,
          targets: state.targets, config: state.config, manualQualification: state.manualQualification,
          appTitle: state.appTitle, appSubtitle: state.appSubtitle, appLogo: state.appLogo
        };
        const { error } = await supabase.from('tournament_sync').upsert({ id: 'current_tournament', state: dataToSync });
        if (error) console.error("❌ ERREUR SUPABASE SYNC:", error.message);
      };

      supabase.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_sync' }, (payload: any) => {
          if (payload.new && payload.new.state) {
            set((state) => ({ ...state, ...payload.new.state }));
          }
        })
        .subscribe();

      const fetchInitialState = async () => {
        const { data, error } = await supabase
          .from('tournament_sync')
          .select('state')
          .eq('id', 'current_tournament')
          .maybeSingle();
          
        if (!error && data && data.state) {
          set((state) => ({ ...state, ...data.state }));
        }
      };
      fetchInitialState();

      return {
        teams: [],
        pools: [],
        poolMatches: [],
        mainBracket: null,
        consBracket: null,
        targets: [1, 2, 3, 4, 5, 6].map(createTarget),
        config: { ...DEFAULT_CONFIG },
        manualQualification: {},
        
        // 👇 VALEURS PAR DÉFAUT DE L'EN-TÊTE 👇
        appTitle: "Tournoi du Bowling",
        appSubtitle: "Limoges Nord · Fléchettes",
        appLogo: null,

        setAppTitle: (title: string) => {
          set({ appTitle: title });
          syncToSupabase();
        },
        
        setAppSubtitle: (subtitle: string) => {
          set({ appSubtitle: subtitle });
          syncToSupabase();
        },
        
        setAppLogo: (logo: string | null) => {
          set({ appLogo: logo });
          syncToSupabase();
        },

        setTargetDefaultPool: (targetId: string, poolId: string | null) => {
          set((state) => ({
            targets: state.targets.map(t => t.id === targetId ? { ...t, defaultPoolId: poolId } : t)
          }));
          syncToSupabase();
        },

        addTeam: (name: string) => {
          set((state) => ({ teams: [...state.teams, { id: crypto.randomUUID(), name: name.trim() }] }));
          syncToSupabase();
        },

        removeTeam: (id: string) => {
          set((state) => ({
            teams: state.teams.filter(t => t.id !== id),
            pools: state.pools.map(p => ({ ...p, teamIds: p.teamIds.filter(tid => tid !== id) })),
            poolMatches: state.poolMatches.filter(m => m.a !== id && m.b !== id)
          }));
          syncToSupabase();
        },

        moveTeam: (id: string, dir: number) => {
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

        setTeamNumber: (id: string, num: number) => {
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

        setConfig: (key: string, value: number) => {
          set((state) => ({ config: { ...state.config, [key]: value } }));
          syncToSupabase();
        },

        setManualQualification: (teamId: string, target: 'main' | 'cons' | null) => {
          set((state) => {
            const newMQ = { ...state.manualQualification };
            if (target) newMQ[teamId] = target;
            else delete newMQ[teamId];
            return { manualQualification: newMQ };
          });
          syncToSupabase();
        },

        movePlayerToPool: (playerId: string, targetPoolId: string | null) => {
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

        removeTarget: (id: string) => {
          set((state) => ({
            targets: state.targets.filter(t => t.id !== id),
            config: { ...state.config, targetCount: state.targets.length - 1 }
          }));
          syncToSupabase();
        },

        updateTargetLabel: (id: string, label: string) => {
          set((state) => ({ targets: state.targets.map(t => t.id === id ? { ...t, label } : t) }));
          syncToSupabase();
        },

        assignTarget: (targetId: string, matchId: string | null) => {
          set((state) => ({
            targets: state.targets.map(t => {
              if (t.id === targetId) return { ...t, matchId };
              if (matchId && t.matchId === matchId) return { ...t, matchId: null };
              return t;
            })
          }));
          syncToSupabase();
        },

        autoAssignTargets: () => {
        const state = get();
        const freeTargets = state.targets.filter(t => !t.matchId);
        if (freeTargets.length === 0) return;

        const pendingMatches = [
          ...state.poolMatches.filter(m => !m.done).map(m => ({ id: m.id, a: m.a, b: m.b })),
          ...(state.mainBracket?.rounds.flat().filter(m => !m.done && m.a && m.b).map(m => ({ id: m.id, a: m.a!, b: m.b! })) || []),
          ...(state.consBracket?.rounds.flat().filter(m => !m.done && m.a && m.b).map(m => ({ id: m.id, a: m.a!, b: m.b! })) || []),
        ];

        const busyPlayers = new Set<string>();
        const busyMatchIds = new Set<string>();

        state.targets.forEach(t => {
          if (t.matchId) {
            busyMatchIds.add(t.matchId);
            const match = pendingMatches.find(pm => pm.id === t.matchId);
            if (match) {
              busyPlayers.add(match.a);
              busyPlayers.add(match.b);
            }
          }
        });

        const availableMatches = pendingMatches.filter(pm => 
          !busyPlayers.has(pm.a) && 
          !busyPlayers.has(pm.b) && 
          !busyMatchIds.has(pm.id)
        );

        const assignments: Record<string, string> = {};
        let matchIndex = 0;

        for (const target of freeTargets) {
          if (matchIndex >= availableMatches.length) break;
          const match = availableMatches[matchIndex];
          if (!busyPlayers.has(match.a) && !busyPlayers.has(match.b)) {
            assignments[target.id] = match.id;
            busyPlayers.add(match.a);
            busyPlayers.add(match.b);
            matchIndex++;
          }
        }

        if (Object.keys(assignments).length > 0) {
          set((state) => ({
            targets: state.targets.map(t => 
              assignments[t.id] ? { ...t, matchId: assignments[t.id] } : t
            )
          }));
          syncToSupabase();
        }
      },

        generatePools: () => {
          const { teams, config, targets } = get();
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

          const updatedTargets = targets.map((t, i) => ({
            ...t,
            defaultPoolId: newPools[i]?.id || null
          }));

          set({ pools: newPools, poolMatches: newMatches, mainBracket: null, consBracket: null, manualQualification: {}, targets: updatedTargets });
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
            // 1. Mettre à jour le match avec le nouveau score
            const newPoolMatches = state.poolMatches.map(m => 
              m.id === matchId ? { ...m, sa, sb, done: true } : m
            );
            const isPoolMatch = newPoolMatches.some(m => m.id === matchId);

            let newMainBracket = state.mainBracket;
            let newConsBracket = state.consBracket;

            if (!isPoolMatch) {
              const updateBracket = (br: Bracket | null) => {
                if (!br) return null;
                const scores = { ...br.scores, [matchId]: { sa, sb } };
                return rebuildBracket({ ...br, scores });
              };
              newMainBracket = updateBracket(state.mainBracket);
              newConsBracket = updateBracket(state.consBracket);
            }

            // 2. Libérer la cible qui accueillait ce match
            let newTargets = state.targets.map(t => t.matchId === matchId ? { ...t, matchId: null } : t);

            // 3. LANCER L'AFFECTATION AUTOMATIQUE GLOBALE
            const freeTargets = newTargets.filter(t => !t.matchId);
            if (freeTargets.length > 0) {
              
              // Récupérer tous les matchs en attente
              const allPending: any[] = [
                ...newPoolMatches.filter(m => !m.done).map(m => ({ ...m, isPool: true })),
                ...(newMainBracket?.rounds.flat().filter(m => !m.done && m.a && m.b).map(m => ({ ...m, isPool: false })) || []),
                ...(newConsBracket?.rounds.flat().filter(m => !m.done && m.a && m.b).map(m => ({ ...m, isPool: false })) || []),
                ...(newMainBracket?.thirdPlaceMatch && !newMainBracket.thirdPlaceMatch.done && newMainBracket.thirdPlaceMatch.a ? [{ ...newMainBracket.thirdPlaceMatch, isPool: false }] : [])
              ];

              // Identifier les joueurs actuellement occupés
              const busyPlayers = new Set<string>();
              newTargets.forEach(t => {
                if (t.matchId) {
                  const m = allPending.find(pm => pm.id === t.matchId);
                  if (m) {
                    if (m.a) busyPlayers.add(m.a);
                    if (m.b) busyPlayers.add(m.b);
                  }
                }
              });

              // Calculer l'avancement des poules pour l'équité
              const poolStats = state.pools.map(pool => {
                const doneCount = newPoolMatches.filter(m => m.poolId === pool.id && m.done).length;
                const activeCount = newTargets.filter(t => {
                  if (!t.matchId) return false;
                  const m = newPoolMatches.find(pm => pm.id === t.matchId);
                  return m && m.poolId === pool.id && !m.done;
                }).length;
                
                return {
                  pool,
                  progress: doneCount + activeCount,
                  hasPending: newPoolMatches.some(m => m.poolId === pool.id && !m.done)
                };
              });
              const activePools = poolStats.filter(ps => ps.hasPending);
              activePools.sort((a, b) => a.progress - b.progress);

              const toAssign: { targetId: string, matchId: string }[] = [];
              const availableMatches = allPending.filter(m => !newTargets.some(t => t.matchId === m.id));

              // Remplir chaque cible libre
              for (const target of freeTargets) {
                let matchToAssign = null;

                // Chercher d'abord un match de poule en retard
                for (const { pool } of activePools) {
                  const match = availableMatches.find(m => 
                    m.isPool && m.poolId === pool.id &&
                    (!m.a || !busyPlayers.has(m.a)) && 
                    (!m.b || !busyPlayers.has(m.b)) &&
                    !toAssign.some(ta => ta.matchId === m.id)
                  );
                  if (match) {
                    matchToAssign = match;
                    break;
                  }
                }

                // Sinon, prendre n'importe quel match disponible (Finales, etc.)
                if (!matchToAssign) {
                  matchToAssign = availableMatches.find(m => 
                    (!m.a || !busyPlayers.has(m.a)) && 
                    (!m.b || !busyPlayers.has(m.b)) &&
                    !toAssign.some(ta => ta.matchId === m.id)
                  );
                }

                if (matchToAssign) {
                  toAssign.push({ targetId: target.id, matchId: matchToAssign.id });
                  if (matchToAssign.a) busyPlayers.add(matchToAssign.a);
                  if (matchToAssign.b) busyPlayers.add(matchToAssign.b);
                }
              }

              // Appliquer les affectations
              toAssign.forEach(({ targetId, matchId }) => {
                const idx = newTargets.findIndex(t => t.id === targetId);
                if (idx !== -1) newTargets[idx] = { ...newTargets[idx], matchId };
              });
            }

            return { 
              poolMatches: newPoolMatches, 
              mainBracket: newMainBracket,
              consBracket: newConsBracket,
              targets: newTargets 
            };
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
            manualQualification: {}, // 👈 CORRIGÉ ICI
            targets: newTargets
          });

          const dataToSync = {
            teams: demoTeams, pools: newPools, poolMatches: newMatches,
            mainBracket: null, consBracket: null,
            targets: newTargets, config: { ...config, targetCount: 6 }, 
            manualQualification: {}, 
            appTitle: state.appTitle, appSubtitle: state.appSubtitle, appLogo: state.appLogo
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