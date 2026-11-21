import type { Team, Pool, Match, Bracket, BracketMatch, TeamStat } from '../types';

export const STANDARD_SEEDS: Record<number, number[]> = {
  2:  [1, 2],
  4:  [1, 4, 3, 2],
  8:  [1, 8, 4, 5, 3, 6, 2, 7],
  16: [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11],
  32: [1, 32, 16, 17, 8, 25, 9, 24, 4, 29, 13, 20, 5, 28, 12, 21,
       2, 31, 15, 18, 7, 26, 10, 23, 3, 30, 14, 19, 6, 27, 11, 22]
};

export const nextPow2 = (n: number) => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};

export const roundName = (idx: number, total: number) => {
  const names: Record<number, string> = {
    1: "Finale", 2: "Demi-finales", 3: "Quarts de finale",
    4: "8es de finale", 5: "16es de finale", 6: "32es de finale"
  };
  return names[total - idx] || `Tour ${idx + 1}`;
};

// Classement d'une poule (Zéro match nul)
export const getPoolStandings = (pool: Pool, matches: Match[], teams: Team[]) => {
  const rows = new Map<string, any>();
  pool.teamIds.forEach(id => rows.set(id, { id, played: 0, w: 0, l: 0, lf: 0, la: 0, pts: 0 }));

  matches.filter(m => m.poolId === pool.id && m.done).forEach(m => {
    if (m.sa === m.sb) return; // Ignore les nuls
    const A = rows.get(m.a), B = rows.get(m.b);
    if (!A || !B) return;
    
    A.played++; B.played++;
    A.lf += m.sa!; A.la += m.sb!; B.lf += m.sb!; B.la += m.sa!;
    
    if (m.sa! > m.sb!) { A.w++; B.l++; A.pts += 2; }
    else { B.w++; A.l++; B.pts += 2; }
  });

  return [...rows.values()].sort((x, y) =>
    (y.pts - x.pts) || ((y.lf - y.la) - (x.lf - x.la)) || (y.lf - x.lf) ||
    (teams.find(t => t.id === x.id)?.name || '').localeCompare(teams.find(t => t.id === y.id)?.name || '')
  );
};

// Calcule la répartition automatique des équipes
export const computeAutoSplit = (pools: Pool[], matches: Match[], teams: Team[], qualify: number) => {
  if (!pools.length) return { qualifies: [], consolante: [], q: qualify, restants: 0 };
  const ranked = pools.map(p => getPoolStandings(p, matches, teams));
  const maxRank = Math.max(...ranked.map(r => r.length));
  const qualifies: string[] = [], consolante: string[] = [];

  for (let rank = 0; rank < maxRank; rank++) {
    const couche: any[] = [];
    ranked.forEach(r => { if (r[rank]) couche.push(r[rank]); });
    couche.sort((x, y) => (y.pts - x.pts) || ((y.lf - y.la) - (x.lf - x.la)) || (y.lf - x.lf));
    couche.forEach(row => { (rank < qualify ? qualifies : consolante).push(row.id); });
  }
  return { qualifies, consolante, q: qualify, restants: matches.filter(m => !m.done).length };
};

// Construit les slots de l'arbre en évitant les rencontres intra-poule
export const buildPoolAwareSlots = (
  teamIds: string[], size: number, seedsArray: number[], pools: Pool[], poolMatches: Match[], teams: Team[]
) => {
  const qualSet = new Set(teamIds);

  // 👇 CAS SPÉCIFIQUE : 4 poules de 4 (16 joueurs). On utilise l'arbre parfait que tu as demandé.
  if (pools.length === 4 && teamIds.length === 16) {
    const standingsA = getPoolStandings(pools[0], poolMatches, teams);
    const standingsB = getPoolStandings(pools[1], poolMatches, teams);
    const standingsC = getPoolStandings(pools[2], poolMatches, teams);
    const standingsD = getPoolStandings(pools[3], poolMatches, teams);

    const getT = (st: any[], idx: number) => {
      const id = st[idx]?.id;
      return id && qualSet.has(id) ? id : null;
    };

    return [
      getT(standingsA, 0), getT(standingsB, 3), // Match 1: 1er A vs 4e B
      getT(standingsC, 1), getT(standingsD, 2), // Match 2: 2e C vs 3e D
      getT(standingsC, 0), getT(standingsD, 3), // Match 3: 1er C vs 4e D
      getT(standingsA, 1), getT(standingsB, 2), // Match 4: 2e A vs 3e B
      getT(standingsB, 0), getT(standingsA, 3), // Match 5: 1er B vs 4e A
      getT(standingsD, 1), getT(standingsC, 2), // Match 6: 2e D vs 3e C
      getT(standingsD, 0), getT(standingsC, 3), // Match 7: 1er D vs 4e C
      getT(standingsB, 1), getT(standingsA, 2), // Match 8: 2e B vs 3e A
    ];
  }

  // 👇 CAS GÉNÉRIQUE (Pour les autres formats : 3 poules, 5 poules, etc.)
  const seedToSlot: Record<number, number> = {};
  seedsArray.forEach((seed, slot) => { seedToSlot[seed] = slot; });

  const byRank = new Map<number, { teamId: string; poolId: string; record: any; rank: number }[]>();
  
  pools.forEach(p => {
    const s = getPoolStandings(p, poolMatches, teams);
    s.forEach((row, idx) => {
      if (qualSet.has(row.id)) {
        const rank = idx + 1;
        if (!byRank.has(rank)) byRank.set(rank, []);
        byRank.get(rank)!.push({ teamId: row.id, poolId: p.id, record: row, rank });
      }
    });
  });

  const cmp = (a: any, b: any) =>
    (b.record.pts - a.record.pts) || ((b.record.lf - b.record.la) - (a.record.lf - a.record.la)) || (b.record.lf - a.record.lf);

  byRank.forEach(arr => arr.sort(cmp));
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
  if (ranks.length === 0) return new Array(size).fill(null);

  const minRank = ranks[0];
  const winners = (byRank.get(minRank) || []).slice();
  const nonWinners: any[] = [];
  for (let r = minRank + 1; r <= 20; r++) {
    const g = byRank.get(r);
    if (g) g.forEach(t => nonWinners.push(t));
  }

  const N = teamIds.length;
  const Nw = Math.min(winners.length, size);
  const slots: (string | null)[] = new Array(size).fill(null);
  const placedSeeds = new Set<number>();

  winners.slice(0, Nw).forEach((w, i) => {
    slots[seedToSlot[i + 1]] = w.teamId;
    placedSeeds.add(i + 1);
  });

  const remaining = nonWinners.slice();

  for (let k = Nw - 1; k >= 0; k--) {
    const oppSeed = size - k;
    if (oppSeed > N || placedSeeds.has(oppSeed) || !remaining.length) continue;
    const winnerPool = winners[k].poolId;
    let pickIdx = remaining.findIndex(t => t.poolId !== winnerPool);
    if (pickIdx === -1) pickIdx = 0;
    const team = remaining.splice(pickIdx, 1)[0];
    slots[seedToSlot[oppSeed]] = team.teamId;
    placedSeeds.add(oppSeed);
  }

  for (let seed = Nw + 1; seed <= N; seed++) {
    if (placedSeeds.has(seed) || !remaining.length) continue;
    const oppSeed = size + 1 - seed;
    const oppWinner = (oppSeed >= 1 && oppSeed <= Nw) ? winners[oppSeed - 1] : null;
    let pickIdx = 0;
    if (oppWinner) {
      pickIdx = remaining.findIndex(t => t.poolId !== oppWinner.poolId);
      if (pickIdx === -1) pickIdx = 0;
    }
    const team = remaining.splice(pickIdx, 1)[0];
    slots[seedToSlot[seed]] = team.teamId;
    placedSeeds.add(seed);
  }

  remaining.forEach(team => {
    for (let slot = 0; slot < size; slot++) {
      if (slots[slot] === null) { slots[slot] = team.teamId; return; }
    }
  });

  return slots;
};

// Reconstruit l'arbre
export const rebuildBracket = (bracket: Bracket): Bracket => {
  const rounds: BracketMatch[][] = [];
  let count = bracket.size / 2, r = 0;
  
  while (count >= 1) {
    const arr: BracketMatch[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: `${bracket.prefix}-r${r}-m${i}`,
        a: null, b: null, sa: null, sb: null, done: false, winner: null, bye: false
      });
    }
    rounds.push(arr);
    count = Math.floor(count / 2);
    r++;
  }

  rounds[0].forEach((m, i) => {
    m.a = bracket.slots[2 * i] ?? null;
    m.b = bracket.slots[2 * i + 1] ?? null;
  });

  for (let ri = 0; ri < rounds.length; ri++) {
    for (const m of rounds[ri]) {
      const sc = bracket.scores[m.id];
      if (m.a && m.b) {
        if (sc && sc.sa !== sc.sb) {
          m.sa = sc.sa; m.sb = sc.sb; m.done = true;
          m.winner = m.sa > m.sb ? m.a : m.b;
        }
      } else if (ri === 0 && (m.a || m.b)) {
        m.bye = true; m.done = true; m.winner = m.a || m.b;
      }
    }
    if (ri < rounds.length - 1) {
      for (let i = 0; i < rounds[ri].length; i++) {
        const m = rounds[ri][i];
        if (!m.winner) continue;
        const nx = rounds[ri + 1][Math.floor(i / 2)];
        if (i % 2 === 0) nx.a = m.winner; else nx.b = m.winner;
      }
    }
  }

  let thirdPlaceMatch: BracketMatch | null = null;
  if (bracket.prefix === 'main' && rounds.length >= 2) {
    const semis = rounds[rounds.length - 2];
    if (semis.length === 2 && semis[0].done && semis[1].done) {
      const loser1 = semis[0].a === semis[0].winner ? semis[0].b : semis[0].a;
      const loser2 = semis[1].a === semis[1].winner ? semis[1].b : semis[1].a;
      const tpId = `${bracket.prefix}-third-place`;
      const sc = bracket.scores[tpId];
      if (loser1 && loser2) {
        thirdPlaceMatch = {
          id: tpId, a: loser1, b: loser2, sa: sc?.sa ?? null, sb: sc?.sb ?? null, done: !!sc,
          winner: sc ? (sc.sa > sc.sb ? loser1 : loser2) : null, bye: false
        };
      }
    }
  }
  return { ...bracket, rounds, thirdPlaceMatch };
};

// Calcule les stats globales (tous matchs confondus)
export const computeGlobalStats = (teams: Team[], poolMatches: Match[], main: Bracket | null, cons: Bracket | null): TeamStat[] => {
  const stats = new Map<string, TeamStat>();
  teams.forEach(t => stats.set(t.id, { id: t.id, name: t.name, played: 0, w: 0, l: 0, lf: 0, la: 0, pts: 0, form: [] }));

  const processMatch = (m: Match | BracketMatch) => {
    if (!m.done || m.sa === null || m.sb === null || !m.a || !m.b || m.sa === m.sb) return;
    const A = stats.get(m.a), B = stats.get(m.b);
    if (!A || !B) return;

    A.played++; B.played++;
    A.lf += m.sa; A.la += m.sb; B.lf += m.sb; B.la += m.sa;

    if (m.sa > m.sb) {
      A.w++; B.l++; A.pts += 2; A.form.push('V'); B.form.push('D');
    } else {
      B.w++; A.l++; B.pts += 2; B.form.push('V'); A.form.push('D');
    }
  };

  poolMatches.forEach(processMatch);
  [main, cons].forEach(br => { if (br) br.rounds.flat().forEach(processMatch); });

  return [...stats.values()].sort((x, y) => 
    (y.pts - x.pts) || ((y.lf - y.la) - (x.lf - x.la)) || (y.lf - x.lf)
  );
};