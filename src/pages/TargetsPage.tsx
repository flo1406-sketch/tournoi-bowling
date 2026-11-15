import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';
import { ScoreInput } from '../components/ScoreInput';

export const TargetsPage = () => {
  const { targets, pools, poolMatches, mainBracket, consBracket, teams, assignTarget, addTarget, autoAssignTargets } = useTournamentStore();

  const pendingMatches = [
    ...poolMatches.filter(m => !m.done).map(m => {
      const pool = pools.find(p => p.id === m.poolId);
      return { id: m.id, label: pool ? pool.name : 'Poule inconnue', a: m.a, b: m.b };
    }),
    ...(mainBracket?.rounds.flat().filter(m => !m.done && m.a && m.b).map(m => ({ id: m.id, label: 'Principal', a: m.a!, b: m.b! })) || []),
    ...(consBracket?.rounds.flat().filter(m => !m.done && m.a && m.b).map(m => ({ id: m.id, label: 'Consolante', a: m.a!, b: m.b! })) || []),
  ];

  const getMatchById = (id: string) => {
    const poolMatch = poolMatches.find(m => m.id === id);
    if (poolMatch) return poolMatch;
    const mainMatch = mainBracket?.rounds.flat().find(m => m.id === id);
    if (mainMatch) return mainMatch;
    return consBracket?.rounds.flat().find(m => m.id === id);
  };

  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || '?';
  const getTeamNumber = (id: string) => teams.findIndex(t => t.id === id) + 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Attribution des cibles ({targets.length})</h2>
        <div className="flex gap-3 flex-wrap">
          {/* 👇 On utilise la nouvelle fonction autoAssignTargets ici */}
          <Button variant="primary" onClick={autoAssignTargets}>
            ⚡ Affectation intelligente
          </Button>
          <Button variant="ghost" onClick={() => targets.forEach(t => assignTarget(t.id, null))}>
            Tout libérer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {targets.map(target => {
          const match = target.matchId ? getMatchById(target.matchId) : null;
          const isBusy = match && !match.done;
          const matchInfo = target.matchId ? pendingMatches.find(pm => pm.id === target.matchId) : null;

          return (
            <div key={target.id} className={`panel ${isBusy ? 'border-bowling-pink shadow-[0_0_15px_rgba(255,0,122,0.3)]' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className={`min-w-[32px] px-2 h-8 rounded flex items-center justify-center font-black ${isBusy ? 'bg-pink-500/20 text-white' : 'bg-bowling-neon/10 text-bowling-neon'}`}>
                    {target.label}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">Cible {target.label}</span>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-bowling-pink shadow-[0_0_10px_#ff007a]' : 'bg-bowling-line'}`} />
              </div>

              {isBusy ? (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-bowling-pink font-bold">
                    {matchInfo ? matchInfo.label : 'Match en cours'}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm bg-black/20 p-1.5 rounded">
                      <div className="flex items-center gap-2 truncate">
                        <span className="badge-team">#{getTeamNumber(match.a!)}</span>
                        <span className="truncate">{getTeamName(match.a!)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm bg-black/20 p-1.5 rounded">
                      <div className="flex items-center gap-2 truncate">
                        <span className="badge-team">#{getTeamNumber(match.b!)}</span>
                        <span className="truncate">{getTeamName(match.b!)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-bowling-line/50 flex justify-center">
                    <ScoreInput matchId={match.id} initialSa={match.sa} initialSb={match.sb} done={match.done} />
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => assignTarget(target.id, null)}>
                    Libérer la cible
                  </Button>
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => assignTarget(target.id, e.target.value || null)}
                  className="input-field w-full text-xs"
                >
                  <option value="">Choisir un match…</option>
                  {pendingMatches.filter(pm => !targets.some(t => t.matchId === pm.id)).map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label} — #{getTeamNumber(pm.a)} vs #{getTeamNumber(pm.b)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}

        <button 
          onClick={addTarget}
          className="panel border-2 border-dashed border-bowling-line hover:border-bowling-neon hover:bg-bowling-neon/5 transition-all flex flex-col items-center justify-center min-h-[150px] gap-2 text-slate-500 hover:text-bowling-neon"
        >
          <span className="text-4xl font-light leading-none">+</span>
          <span className="text-xs font-bold uppercase tracking-wider">Ajouter une cible</span>
        </button>
      </div>

      <div className="panel">
        <h3 className="text-lg font-bold mb-4">File d'attente</h3>
        {pendingMatches.filter(pm => !targets.some(t => t.matchId === pm.id)).length === 0 ? (
          <p className="text-slate-400 text-sm">Aucun match en attente.</p>
        ) : (
          <ul className="space-y-2">
            {pendingMatches.filter(pm => !targets.some(t => t.matchId === pm.id)).map(pm => (
              <li key={pm.id} className="flex items-center gap-3 p-2 bg-black/20 rounded text-sm">
                <span className="text-xs px-2 py-0.5 rounded bg-bowling-neon/20 text-bowling-neon font-bold min-w-[70px] text-center shrink-0">
                  {pm.label}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-slate-200">#{getTeamNumber(pm.a)} {getTeamName(pm.a)}</span>
                  <b className="text-slate-500 mx-1">vs</b>
                  <span className="font-semibold text-slate-200">#{getTeamNumber(pm.b)} {getTeamName(pm.b)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};