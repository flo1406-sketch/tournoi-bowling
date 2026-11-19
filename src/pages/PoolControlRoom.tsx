import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';

const PoolMatchCard = ({ match, teams, onRelease }: { match: any, teams: any[], onRelease: () => void }) => {
  const { commitScore, config } = useTournamentStore();
  const [sa, setSa] = useState('');
  const [sb, setSb] = useState('');

  const handleValidate = () => {
    const valA = parseInt(sa) || 0;
    const valB = parseInt(sb) || 0;
    if (valA === valB) {
      alert("Pas de match nul aux fléchettes !");
      return;
    }
    commitScore(match.id, valA, valB);
  };

  return (
    <div className="flex flex-col justify-between h-full p-2">
      <div>
        <div className="text-center text-[10px] font-bold uppercase tracking-wider mb-2 py-1 px-1 rounded bg-bowling-neon/10 text-bowling-neon flex flex-col items-center justify-center leading-tight">
          <span className="truncate w-full px-1">{match.poolName}</span>
          <span className="text-[9px] text-white opacity-90">BO{config.legsToWinPool * 2 - 1}</span>
        </div>
        
        <div className="flex items-center justify-between gap-2 bg-black/20 p-1.5 rounded mb-2">
          <span className="truncate flex-1 font-bold text-sm text-white pl-1">
            {teams.find(t => t.id === match.a)?.name}
          </span>
          <input
            type="number"
            min="0"
            value={sa}
            onChange={(e) => setSa(e.target.value)}
            className="w-10 h-8 text-center bg-bowling-dark border border-bowling-line rounded text-bowling-neon font-bold text-lg outline-none focus:border-bowling-neon [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2 bg-black/20 p-1.5 rounded mb-3">
          <span className="truncate flex-1 font-bold text-sm text-white pl-1">
            {teams.find(t => t.id === match.b)?.name}
          </span>
          <input
            type="number"
            min="0"
            value={sb}
            onChange={(e) => setSb(e.target.value)}
            className="w-10 h-8 text-center bg-bowling-dark border border-bowling-line rounded text-bowling-neon font-bold text-lg outline-none focus:border-bowling-neon [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <Button 
          variant="primary" 
          onClick={handleValidate}
          className="w-full text-xs py-1.5 h-auto shadow-none"
        >
          ✓ Valider
        </Button>

        <div className="mt-2 text-center">
          <button onClick={onRelease} className="text-[9px] text-slate-500 hover:text-red-400 underline decoration-dotted transition-colors">
            Annuler le match
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <div className="bg-white p-1 rounded">
          <QRCodeSVG 
            value={`${window.location.origin}/score/${match.poolId}`} 
            size={55} 
            level="L" 
          />
        </div>
      </div>
    </div>
  );
};

export const PoolControlRoom = () => {
  const { pools, poolMatches, targets, teams, assignTarget, setTargetDefaultPool } = useTournamentStore();

  const allPendingMatches = poolMatches.filter(m => !m.done);
  const unassignedMatches = allPendingMatches.filter(m => !targets.some(t => t.matchId === m.id));

  const handleAutoAssign = () => {
    const freeTargets = targets.filter(t => !t.matchId);
    if (freeTargets.length === 0) return;

    const busyPlayers = new Set<string>();
    targets.forEach(t => {
      if (t.matchId) {
        const m = poolMatches.find(pm => pm.id === t.matchId);
        if (m && !m.done) {
          busyPlayers.add(m.a);
          busyPlayers.add(m.b);
        }
      }
    });

    const poolStats = pools.map(pool => {
      const doneCount = poolMatches.filter(m => m.poolId === pool.id && m.done).length;
      const activeCount = targets.filter(t => {
        if (!t.matchId) return false;
        const m = poolMatches.find(pm => pm.id === t.matchId);
        return m && m.poolId === pool.id && !m.done;
      }).length;
      
      return {
        pool,
        progress: doneCount + activeCount,
        hasPending: poolMatches.some(m => m.poolId === pool.id && !m.done)
      };
    });

    const activePools = poolStats.filter(ps => ps.hasPending);
    activePools.sort((a, b) => a.progress - b.progress);

    const toAssign: { targetId: string, matchId: string }[] = [];
    const availableMatches = poolMatches.filter(m => !m.done && !targets.some(t => t.matchId === m.id));

    for (const target of freeTargets) {
      let matchToAssign = null;

      for (const { pool } of activePools) {
        const match = availableMatches.find(m => 
          m.poolId === pool.id && 
          !busyPlayers.has(m.a) && 
          !busyPlayers.has(m.b) &&
          !toAssign.some(ta => ta.matchId === m.id)
        );
        if (match) {
          matchToAssign = match;
          break;
        }
      }

      if (!matchToAssign) {
        matchToAssign = availableMatches.find(m => 
          !busyPlayers.has(m.a) && 
          !busyPlayers.has(m.b) &&
          !toAssign.some(ta => ta.matchId === m.id)
        );
      }

      if (matchToAssign) {
        toAssign.push({ targetId: target.id, matchId: matchToAssign.id });
        busyPlayers.add(matchToAssign.a);
        busyPlayers.add(matchToAssign.b);
      }
    }

    toAssign.forEach(({ targetId, matchId }) => {
      assignTarget(targetId, matchId);
    });
  };

  const getNextMatch = (poolId: string) => {
    const pending = poolMatches.filter(m => m.poolId === poolId && !m.done);
    const lastPlayed = [...poolMatches]
      .filter(m => m.poolId === poolId && m.done)
      .sort((a, b) => a.id.localeCompare(b.id))
      .pop();

    const busyPlayers = new Set<string>();
    targets.forEach(t => {
      if (t.matchId) {
        const m = poolMatches.find(pm => pm.id === t.matchId);
        if (m && !m.done) {
          busyPlayers.add(m.a);
          busyPlayers.add(m.b);
        }
      }
    });

    const available = pending.filter(m => !busyPlayers.has(m.a) && !busyPlayers.has(m.b));
    
    if (lastPlayed) {
      const freshMatch = available.find(m => 
        m.a !== lastPlayed.a && m.a !== lastPlayed.b && 
        m.b !== lastPlayed.a && m.b !== lastPlayed.b
      );
      if (freshMatch) return freshMatch;
    }
    return available[0];
  };

  return (
    // 👇 Remplacement de h-[calc(...)] par h-full pour s'adapter au parent
    <div className="flex flex-col gap-4 h-full w-full overflow-hidden">
      
      {/* Zone des cibles qui prend tout l'espace disponible (flex-1) */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {targets.map((target) => {
          const defaultPool = pools.find(p => p.id === target.defaultPoolId);
          const currentMatch = target.matchId ? poolMatches.find(m => m.id === target.matchId) : null;
          const isBusy = currentMatch && !currentMatch.done;
          const currentMatchPool = currentMatch?.poolId ? pools.find(p => p.id === currentMatch.poolId) : null;
          const nextDefaultMatch = (!isBusy && defaultPool) ? getNextMatch(defaultPool.id) : null;

          return (
            <div key={target.id} className={`flex-1 min-w-0 bg-bowling-panel border ${isBusy ? 'border-bowling-neon shadow-[0_0_15px_rgba(0,243,255,0.15)]' : 'border-bowling-line'} rounded-xl flex flex-col overflow-hidden`}>
              <div className={`p-2 flex flex-col items-center border-b ${isBusy ? 'bg-bowling-neon/10 border-bowling-neon/30' : 'bg-black/30 border-bowling-line'}`}>
                <span className={`text-2xl font-black ${isBusy ? 'text-bowling-neon' : 'text-slate-500'}`}>
                  {target.label}
                </span>
                
                {!isBusy && (
                  <select
                    value={target.defaultPoolId || ""}
                    onChange={(e) => setTargetDefaultPool(target.id, e.target.value || null)}
                    className="mt-1 text-[10px] bg-black/40 text-slate-300 border border-bowling-line rounded px-1 py-0.5 outline-none w-full text-center cursor-pointer hover:border-bowling-neon transition-colors"
                  >
                    <option value="">-- Assigner une poule --</option>
                    {pools.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {isBusy && currentMatch ? (
                <PoolMatchCard 
                  key={currentMatch.id}
                  match={{...currentMatch, poolName: currentMatchPool?.name}} 
                  teams={teams} 
                  onRelease={() => assignTarget(target.id, null)} 
                />
              ) : (
                <div className="flex-1 flex flex-col justify-center gap-2 p-2">
                  {nextDefaultMatch && defaultPool ? (
                    <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded border border-bowling-neon/20">
                      <div className="text-[10px] text-slate-400">Match de la {defaultPool.name} :</div>
                      <div className="text-[10px] text-bowling-neon text-center truncate w-full">
                        {teams.find(t => t.id === nextDefaultMatch.a)?.name} vs {teams.find(t => t.id === nextDefaultMatch.b)?.name}
                      </div>
                      <Button variant="primary" size="sm" onClick={() => assignTarget(target.id, nextDefaultMatch.id)} className="w-full text-[10px] py-1 h-auto mt-1">
                        🚀 Lancer
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center opacity-60 text-[10px] text-green-400 py-2">
                      {defaultPool ? `✅ ${defaultPool.name} terminée` : 'Cible libre'}
                    </div>
                  )}

                  <div className="mt-1">
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) assignTarget(target.id, e.target.value); }}
                      className="input-field w-full text-[10px] py-1 bg-black/40"
                    >
                      <option value="">+ Prendre un match…</option>
                      {unassignedMatches.map(m => {
                        const p = pools.find(pool => pool.id === m.poolId);
                        return (
                          <option key={m.id} value={m.id}>
                            [{p?.name}] {teams.find(t => t.id === m.a)?.name} vs {teams.find(t => t.id === m.b)?.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zone de la file d'attente qui garde sa taille (shrink-0) */}
      <div className="h-40 bg-bowling-panel border border-bowling-line rounded-xl p-3 flex flex-col shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-bowling-neon">
            ⏳ File d'attente ({unassignedMatches.length} matchs)
          </h3>
          <Button variant="primary" size="sm" onClick={handleAutoAssign} className="text-xs py-1 h-auto">
            ⚡ Affectation auto (Régulée)
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          {unassignedMatches.map(m => {
            const p = pools.find(pool => pool.id === m.poolId);
            return (
              <div key={m.id} className="bg-black/30 border border-bowling-line rounded p-1.5 flex items-center justify-between text-[11px]">
                <span className="font-bold text-bowling-neon shrink-0 mr-2">{p?.name}</span>
                <span className="truncate flex-1 text-slate-300">
                  {teams.find(t => t.id === m.a)?.name} <span className="text-slate-500">vs</span> {teams.find(t => t.id === m.b)?.name}
                </span>
              </div>
            );
          })}
          {unassignedMatches.length === 0 && (
            <div className="col-span-full text-center text-slate-500 text-sm mt-4">
              Tous les matchs sont actuellement sur des cibles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};