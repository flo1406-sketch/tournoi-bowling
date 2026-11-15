import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';
import { roundName } from '../utils/tournamentLogic';

const FinalMatchCard = ({ match, teams, onRelease }: { match: any, teams: any[], onRelease: () => void }) => {
  const { commitScore, config } = useTournamentStore();
  const [sa, setSa] = useState(match.sa?.toString() || '');
  const [sb, setSb] = useState(match.sb?.toString() || '');

  const boValue = match.isMain 
    ? config.legsToWinMain * 2 - 1 
    : config.legsToWinCons * 2 - 1;

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
    <div className="flex-1 flex flex-col p-2">
      <div className={`text-center text-[9px] font-bold uppercase tracking-wider mb-2 py-1 px-1 rounded flex flex-col items-center justify-center leading-tight ${match.isMain ? 'bg-green-900/40 text-green-400' : 'bg-pink-900/40 text-pink-400'}`}>
        <span>{match.isMain ? 'Principal' : 'Consolante'}</span>
        <span className="text-[9px] text-white opacity-90 truncate w-full px-1">{match.label}</span>
        <span className="text-[9px] text-bowling-neon">BO{boValue}</span>
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
  );
};

export const FinalControlRoom = () => {
  const { mainBracket, consBracket, targets, teams, assignTarget } = useTournamentStore();

  const allPendingMatches: { id: string, a: string, b: string, label: string, isMain: boolean }[] = [];
  
  if (mainBracket) {
    mainBracket.rounds.forEach((round, ri) => {
      round.filter(m => m.a && m.b && !m.done).forEach(m => {
        allPendingMatches.push({ 
          id: m.id, a: m.a!, b: m.b!, 
          label: roundName(ri, mainBracket.rounds.length), isMain: true 
        });
      });
    });
    if (mainBracket.thirdPlaceMatch && mainBracket.thirdPlaceMatch.a && mainBracket.thirdPlaceMatch.b && !mainBracket.thirdPlaceMatch.done) {
      allPendingMatches.push({ 
        id: mainBracket.thirdPlaceMatch.id, a: mainBracket.thirdPlaceMatch.a, b: mainBracket.thirdPlaceMatch.b, 
        label: 'Petite Finale', isMain: true 
      });
    }
  }

  if (consBracket) {
    consBracket.rounds.forEach((round, ri) => {
      round.filter(m => m.a && m.b && !m.done).forEach(m => {
        allPendingMatches.push({ 
          id: m.id, a: m.a!, b: m.b!, 
          label: roundName(ri, consBracket.rounds.length), isMain: false 
        });
      });
    });
  }

  const unassignedMatches = allPendingMatches.filter(m => !targets.some(t => t.matchId === m.id));

  const handleAutoAssign = () => {
    const freeTargets = targets.filter(t => !t.matchId);
    if (freeTargets.length === 0) return;

    const busyPlayers = new Set<string>();
    targets.forEach(t => {
      if (t.matchId) {
        const m = allPendingMatches.find(pm => pm.id === t.matchId);
        if (m) {
          busyPlayers.add(m.a);
          busyPlayers.add(m.b);
        }
      }
    });

    const assignedMatchIds = new Set(targets.map(t => t.matchId).filter(Boolean) as string[]);

    for (const target of freeTargets) {
      const availableMatch = allPendingMatches.find(m => 
        !busyPlayers.has(m.a) && !busyPlayers.has(m.b) && !assignedMatchIds.has(m.id)
      );

      if (availableMatch) {
        assignTarget(target.id, availableMatch.id);
        assignedMatchIds.add(availableMatch.id);
        busyPlayers.add(availableMatch.a);
        busyPlayers.add(availableMatch.b);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
      <div className="flex-1 flex gap-2 overflow-hidden">
        {targets.map((target) => {
          const currentMatch = target.matchId ? allPendingMatches.find(m => m.id === target.matchId) : null;
          const isBusy = !!currentMatch;

          return (
            <div key={target.id} className={`flex-1 min-w-0 bg-bowling-panel border ${isBusy ? 'border-bowling-neon shadow-[0_0_15px_rgba(0,243,255,0.15)]' : 'border-bowling-line'} rounded-xl flex flex-col overflow-hidden`}>
              
              <div className={`p-2 flex flex-col items-center border-b ${isBusy ? 'bg-bowling-neon/10 border-bowling-neon/30' : 'bg-black/30 border-bowling-line'}`}>
                <span className={`text-2xl font-black ${isBusy ? 'text-bowling-neon' : 'text-slate-500'}`}>
                  {target.label}
                </span>
              </div>

              {isBusy && currentMatch ? (
                <FinalMatchCard 
                  key={currentMatch.id}
                  match={currentMatch} 
                  teams={teams} 
                  onRelease={() => assignTarget(target.id, null)} 
                />
              ) : (
                <div className="flex-1 flex flex-col justify-center gap-2 p-2">
                  <div className="text-center text-xs text-slate-500 mb-1">
                    Cible libre
                  </div>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) assignTarget(target.id, e.target.value); }}
                    className="input-field w-full text-[11px] py-1.5 bg-black/40"
                  >
                    <option value="">+ Match…</option>
                    {unassignedMatches.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.isMain ? 'P' : 'C'}] {teams.find(t => t.id === m.a)?.name} vs {teams.find(t => t.id === m.b)?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isBusy && currentMatch && (
                <div className="p-1.5 flex justify-center bg-black/20 border-t border-bowling-line mt-auto">
                  <div className="bg-white p-0.5 rounded">
                    <QRCodeSVG 
                      value={`${window.location.origin}/score/final/${currentMatch.id}`} 
                      size={55} 
                      level="L" 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-40 bg-bowling-panel border border-bowling-line rounded-xl p-3 flex flex-col shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-bowling-neon">
            ⏳ File d'attente ({unassignedMatches.length} matchs)
          </h3>
          <Button variant="primary" size="sm" onClick={handleAutoAssign} className="text-xs py-1 h-auto">
            ⚡ Affectation auto
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          {unassignedMatches.map(m => (
            <div key={m.id} className="bg-black/30 border border-bowling-line rounded p-1.5 flex items-center justify-between text-[11px]">
              <span className={`font-bold shrink-0 mr-2 ${m.isMain ? 'text-green-400' : 'text-pink-400'}`}>
                {m.label}
              </span>
              <span className="truncate flex-1 text-slate-300">
                {teams.find(t => t.id === m.a)?.name} <span className="text-slate-500">vs</span> {teams.find(t => t.id === m.b)?.name}
              </span>
            </div>
          ))}
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