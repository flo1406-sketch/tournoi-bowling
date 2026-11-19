import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTournamentStore } from '../store/useTournamentStore';
import { roundName } from '../utils/tournamentLogic';
import type { Bracket, BracketMatch, Target } from '../types';
import { Button } from '../components/Button';
import { FinalControlRoom } from './FinalControlRoom';

const getRoundColor = (roundIndex: number, totalRounds: number) => {
  if (roundIndex === totalRounds - 1) return 'border-yellow-500 bg-yellow-900/20 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
  if (roundIndex === totalRounds - 2) return 'border-orange-500 bg-orange-900/20';
  if (roundIndex === totalRounds - 3) return 'border-blue-500 bg-blue-900/20';
  return 'border-green-500/50 bg-green-900/10';
};

const Podium = ({ bracket, title }: { bracket: Bracket | null, title: string }) => {
  const { teams } = useTournamentStore();
  if (!bracket) return null;

  const finalMatch = bracket.rounds[bracket.rounds.length - 1]?.[0];
  let first = finalMatch?.winner || null;
  let second = finalMatch?.done ? (finalMatch.a === first ? finalMatch.b : finalMatch.a) : null;
  let third = bracket.thirdPlaceMatch?.winner || null;

  const getTeamName = (id: string | null) => id ? (teams.find(t => t.id === id)?.name || '?') : '—';

  return (
    <div className="bg-black/20 border border-bowling-line rounded-lg p-3 mb-4 flex flex-wrap items-center gap-6">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 border-r border-bowling-line pr-4">
        Podium<br/><span className="text-white text-sm">{title}</span>
      </div>
      <div className="flex flex-wrap gap-6 flex-1">
        <div className={`flex items-center gap-2 ${first ? '' : 'opacity-40'}`}>
          <span className="text-xl">🥇</span>
          <span className={`font-bold ${first ? 'text-yellow-400' : 'text-slate-500'}`}>{getTeamName(first)}</span>
        </div>
        <div className={`flex items-center gap-2 ${second ? '' : 'opacity-40'}`}>
          <span className="text-xl">🥈</span>
          <span className={`font-bold ${second ? 'text-gray-300' : 'text-slate-500'}`}>{getTeamName(second)}</span>
        </div>
        <div className={`flex items-center gap-2 ${third ? '' : 'opacity-40'}`}>
          <span className="text-xl">🥉</span>
          <span className={`font-bold ${third ? 'text-orange-300' : 'text-slate-500'}`}>{getTeamName(third)}</span>
        </div>
      </div>
    </div>
  );
};

const ThirdPlaceCard = ({ bracket }: { bracket: Bracket }) => {
  const { teams, commitScore, clearMatch, config } = useTournamentStore();
  const [tempSa, setTempSa] = useState(bracket.thirdPlaceMatch?.sa?.toString() || '');
  const [tempSb, setTempSb] = useState(bracket.thirdPlaceMatch?.sb?.toString() || '');

  useEffect(() => {
    setTempSa(bracket.thirdPlaceMatch?.sa?.toString() || '');
    setTempSb(bracket.thirdPlaceMatch?.sb?.toString() || '');
  }, [bracket.thirdPlaceMatch?.sa, bracket.thirdPlaceMatch?.sb]);

  if (!bracket.thirdPlaceMatch) return null;
  const m = bracket.thirdPlaceMatch;
  const winA = m.done && m.winner === m.a;
  const winB = m.done && m.winner === m.b;

  const handleValidate = () => {
    const sa = parseInt(tempSa) || 0;
    const sb = parseInt(tempSb) || 0;
    if (sa === sb) return alert("Pas de match nul !");
    commitScore(m.id, sa, sb);
  };

  return (
    <div className="bg-black/30 border border-orange-500/30 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
          🥉 Petite Finale (Match pour la 3ème place)
          <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">
            Best of {config.legsToWinMain * 2 - 1}
          </span>
        </h4>
        {m.done && (
          <button onClick={() => clearMatch(m.id)} className="text-[10px] text-slate-500 hover:text-red-400 underline font-bold transition-colors">
            ↺ Modifier
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <div className={`flex items-center justify-between p-2 rounded ${winA ? 'bg-orange-500/20' : 'bg-black/20'}`}>
          <span className={`truncate flex-1 font-bold ${winA ? 'text-orange-300' : 'text-slate-200'}`}>
            {teams.find(t => t.id === m.a)?.name}
          </span>
          <input
            type="number"
            min="0"
            value={tempSa}
            onChange={(e) => setTempSa(e.target.value)}
            disabled={m.done}
            className={`w-12 text-center font-bold text-sm rounded border px-1 py-1 outline-none transition-colors ${m.done ? 'bg-black/20 border-transparent text-slate-400' : 'bg-black/40 border-bowling-line text-bowling-neon focus:border-bowling-neon focus:bg-black/60'}`}
          />
        </div>
        <div className={`flex items-center justify-between p-2 rounded mt-1 ${winB ? 'bg-orange-500/20' : 'bg-black/20'}`}>
          <span className={`truncate flex-1 font-bold ${winB ? 'text-orange-300' : 'text-slate-200'}`}>
            {teams.find(t => t.id === m.b)?.name}
          </span>
          <input
            type="number"
            min="0"
            value={tempSb}
            onChange={(e) => setTempSb(e.target.value)}
            disabled={m.done}
            className={`w-12 text-center font-bold text-sm rounded border px-1 py-1 outline-none transition-colors ${m.done ? 'bg-black/20 border-transparent text-slate-400' : 'bg-black/40 border-bowling-line text-bowling-neon focus:border-bowling-neon focus:bg-black/60'}`}
          />
        </div>
      </div>

      {!m.done && (
        <div className="mt-3 flex justify-center">
          <Button variant="primary" size="sm" onClick={handleValidate} className="text-xs py-1 h-auto">
            ✓ Valider le score
          </Button>
        </div>
      )}
    </div>
  );
};

interface MatchCardProps {
  match: BracketMatch;
  matchNumber: number;
  roundIndex: number;
  totalRounds: number;
  brKey: 'main' | 'cons';
  isEditMode: boolean;
  selectedSlot: { brKey: string; idx: number } | null;
  onSelectSlot: (brKey: 'main' | 'cons', idx: number) => void;
  targets: Target[];
  assignTarget: (targetId: string, matchId: string | null) => void;
}

const MatchCard = ({ match, matchNumber, roundIndex, totalRounds, brKey, isEditMode, selectedSlot, onSelectSlot, targets, assignTarget }: MatchCardProps) => {
  const { teams, commitScore, clearMatch } = useTournamentStore();
  const [tempSa, setTempSa] = useState(match.sa?.toString() || '');
  const [tempSb, setTempSb] = useState(match.sb?.toString() || '');

  useEffect(() => {
    setTempSa(match.sa?.toString() || '');
    setTempSb(match.sb?.toString() || '');
  }, [match.sa, match.sb]);

  const colorClass = getRoundColor(roundIndex, totalRounds);
  const canEdit = isEditMode && roundIndex === 0 && !match.done;

  const slotA = roundIndex === 0 ? matchNumber * 2 - 2 : null;
  const slotB = roundIndex === 0 ? matchNumber * 2 - 1 : null;

  const isSelA = canEdit && selectedSlot?.brKey === brKey && selectedSlot?.idx === slotA;
  const isSelB = canEdit && selectedSlot?.brKey === brKey && selectedSlot?.idx === slotB;

  const currentTarget = targets.find(t => t.matchId === match.id);
  const canAssignTarget = match.a && match.b && !match.done && !isEditMode;
  const hasPlayers = match.a && match.b;

  const handleValidate = () => {
    const sa = parseInt(tempSa) || 0;
    const sb = parseInt(tempSb) || 0;
    if (sa === sb) return alert("Pas de match nul !");
    commitScore(match.id, sa, sb);
  };

  return (
    <div className={`relative p-2 rounded border ${colorClass} transition-all ${canEdit ? 'hover:border-bowling-neon cursor-pointer' : ''}`}>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] text-slate-400 font-bold uppercase">
          Match {matchNumber}
          {canEdit && <span className="text-bowling-neon ml-2">✏</span>}
          {match.bye && <span className="text-green-400 ml-2">BYE</span>}
        </div>

        {canAssignTarget ? (
          <select
            value={currentTarget?.id || ""}
            onChange={(e) => assignTarget(e.target.value, match.id)}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer outline-none ${currentTarget ? 'bg-bowling-pink/20 text-bowling-pink border-bowling-pink/50' : 'bg-black/30 text-slate-400 border-bowling-line hover:border-bowling-neon hover:text-white'}`}
          >
            <option value="">-- Cible --</option>
            {targets.map(t => (
              <option key={t.id} value={t.id}>Cible {t.label}</option>
            ))}
          </select>
        ) : currentTarget ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-bowling-pink/20 text-bowling-pink border border-bowling-pink/50">
            🎯 Cible {currentTarget.label}
          </span>
        ) : null}
      </div>
      
      <div 
        className={`flex items-center justify-between gap-2 p-1 rounded transition-colors ${match.winner === match.a ? 'bg-bowling-neon/10' : ''} ${isSelA ? 'bg-bowling-neon/30 outline outline-1 outline-bowling-neon' : 'hover:bg-white/5'}`}
        onClick={() => canEdit && slotA !== null && onSelectSlot(brKey, slotA)}
      >
        <span className={`truncate flex-1 text-sm ${match.winner === match.a ? 'text-bowling-neon font-bold' : 'text-slate-200'}`}>
          {match.a ? teams.find(t => t.id === match.a)?.name : '— (vide)'}
        </span>
        {!isEditMode && hasPlayers && (
          <input
            type="number"
            min="0"
            value={tempSa}
            onChange={(e) => setTempSa(e.target.value)}
            disabled={match.done}
            className={`w-10 text-center font-bold text-sm rounded border px-1 py-0.5 outline-none transition-colors ${match.done ? 'bg-black/20 border-transparent text-slate-400' : 'bg-black/40 border-bowling-line text-bowling-neon focus:border-bowling-neon focus:bg-black/60'}`}
          />
        )}
      </div>
      
      <div 
        className={`flex items-center justify-between gap-2 p-1 mt-1 rounded transition-colors ${match.winner === match.b ? 'bg-bowling-neon/10' : ''} ${isSelB ? 'bg-bowling-neon/30 outline outline-1 outline-bowling-neon' : 'hover:bg-white/5'}`}
        onClick={() => canEdit && slotB !== null && onSelectSlot(brKey, slotB)}
      >
        <span className={`truncate flex-1 text-sm ${match.winner === match.b ? 'text-bowling-neon font-bold' : 'text-slate-200'}`}>
          {match.b ? teams.find(t => t.id === match.b)?.name : '— (vide)'}
        </span>
        {!isEditMode && hasPlayers && (
          <input
            type="number"
            min="0"
            value={tempSb}
            onChange={(e) => setTempSb(e.target.value)}
            disabled={match.done}
            className={`w-10 text-center font-bold text-sm rounded border px-1 py-0.5 outline-none transition-colors ${match.done ? 'bg-black/20 border-transparent text-slate-400' : 'bg-black/40 border-bowling-line text-bowling-neon focus:border-bowling-neon focus:bg-black/60'}`}
          />
        )}
      </div>

      {/* 👇 CORRECTION ICI : On affiche le bloc si on a des joueurs, peu importe si c'est fini ou non 👇 */}
      {!isEditMode && hasPlayers && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
          {!match.done ? (
            <>
              <div className="w-8"></div>
              <button onClick={handleValidate} className="btn btn-primary text-xs py-1 px-3 h-auto">
                ✓ Valider
              </button>
            </>
          ) : (
            <>
              <div className="text-[10px] font-bold text-green-400">Terminé</div>
              <button onClick={() => clearMatch(match.id)} className="text-[10px] text-slate-500 hover:text-red-400 underline font-bold transition-colors">
                ↺ Modifier
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const BracketView = ({ bracket, brKey, isEditMode, selectedSlot, onSelectSlot, targets, assignTarget }: { 
  bracket: Bracket; brKey: 'main' | 'cons'; isEditMode: boolean; 
  selectedSlot: { brKey: string; idx: number } | null; 
  onSelectSlot: (brKey: 'main' | 'cons', idx: number) => void;
  targets: Target[];
  assignTarget: (targetId: string, matchId: string | null) => void;
}) => {
  const { config } = useTournamentStore();
  
  return (
    <div className="panel overflow-hidden mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          {bracket.name}
          <span className="text-xs font-bold text-bowling-neon bg-bowling-neon/10 px-2 py-0.5 rounded border border-bowling-neon/30">
            Best of {(bracket.prefix === 'main' ? config.legsToWinMain : config.legsToWinCons) * 2 - 1}
          </span>
        </h3>
        <span className="text-sm text-slate-400">{bracket.size} joueurs</span>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-6">
        {bracket.rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col gap-4 min-w-[230px]">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-center border-b border-bowling-line pb-2 mb-2">
              {roundName(ri, bracket.rounds.length)}
            </h4>
            <div className="flex flex-col gap-4 justify-around h-full">
              {round.map((match, mi) => {
                const matchNum = mi + 1; 
                return (
                  <div key={match.id} className="relative">
                    <MatchCard 
                      match={match} 
                      matchNumber={matchNum} 
                      roundIndex={ri} 
                      totalRounds={bracket.rounds.length} 
                      brKey={brKey}
                      isEditMode={isEditMode}
                      selectedSlot={selectedSlot}
                      onSelectSlot={onSelectSlot}
                      targets={targets}
                      assignTarget={assignTarget}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FinalsPage = () => {
  const { mainBracket, consBracket, swapBracketSlots, targets, assignTarget, teams } = useTournamentStore();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ brKey: string; idx: number } | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'control'>('tree');
  const [showQR, setShowQR] = useState(false);

  const handleSelectSlot = (brKey: 'main' | 'cons', idx: number) => {
    if (!isEditMode) return;

    if (!selectedSlot) {
      setSelectedSlot({ brKey, idx });
    } else if (selectedSlot.brKey === brKey && selectedSlot.idx === idx) {
      setSelectedSlot(null);
    } else if (selectedSlot.brKey === brKey) {
      swapBracketSlots(brKey, selectedSlot.idx, idx);
      setSelectedSlot(null);
    } else {
      setSelectedSlot({ brKey, idx });
    }
  };

  if (!mainBracket && !consBracket) {
    return (
      <div className="panel text-center py-12">
        <h2 className="text-xl font-bold mb-4">Phase finale non générée</h2>
        <p className="text-slate-400 mb-6">Termine les poules puis génère les tableaux.</p>
        <Link to="/poules" className="btn btn-primary">← Retour aux poules</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Phase finale</h2>
        
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => setShowQR(true)}>
            📱 QR Codes
          </Button>

          <Button 
            variant={viewMode === 'control' ? 'primary' : 'ghost'} 
            onClick={() => setViewMode(viewMode === 'control' ? 'tree' : 'control')}
          >
            {viewMode === 'control' ? '🌳 Vue Arbre' : '🎯 Contrôle Cibles'}
          </Button>

          {viewMode === 'tree' && (
            <Button 
              variant={isEditMode ? 'danger' : 'primary'} 
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedSlot(null);
              }}
            >
              {isEditMode ? '✕ Quitter l\'édition' : '✏ Modifier les placements'}
            </Button>
          )}
        </div>
      </div>

      {isEditMode && viewMode === 'tree' && (
        <div className="p-3 bg-bowling-neon/10 border border-bowling-neon/30 rounded-lg text-sm text-bowling-neon flex items-center justify-between mb-6">
          <span>Clique sur un joueur (ou une case vide) du 1er tour, puis sur un autre pour les échanger.</span>
          {selectedSlot && <Button size="sm" variant="ghost" onClick={() => setSelectedSlot(null)}>Annuler</Button>}
        </div>
      )}

      {viewMode === 'control' ? (
        <FinalControlRoom />
      ) : (
        <div className="flex flex-col gap-6">
          {mainBracket && (
            <div>
              <Podium bracket={mainBracket} title="Principal" />
              <ThirdPlaceCard bracket={mainBracket} />
              <BracketView 
                bracket={mainBracket} 
                brKey="main" 
                isEditMode={isEditMode} 
                selectedSlot={selectedSlot} 
                onSelectSlot={handleSelectSlot} 
                targets={targets}
                assignTarget={assignTarget}
              />
            </div>
          )}

          {consBracket && (
            <div>
              <Podium bracket={consBracket} title="Consolante" />
              <BracketView 
                bracket={consBracket} 
                brKey="cons" 
                isEditMode={isEditMode} 
                selectedSlot={selectedSlot} 
                onSelectSlot={handleSelectSlot} 
                targets={targets}
                assignTarget={assignTarget}
              />
            </div>
          )}
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-bowling-panel border border-bowling-line rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">QR Codes - Phase Finale</h3>
              <Button variant="danger" size="sm" onClick={() => setShowQR(false)}>Fermer</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-center text-green-400 font-bold uppercase tracking-wider mb-4 border-b border-bowling-line pb-2">Tableau Principal</h4>
                <div className="grid grid-cols-2 gap-4">
                  {mainBracket?.rounds.flat().filter(m => m.a && m.b && !m.done).map((m) => (
                    <div key={m.id} className="bg-white p-2 rounded-lg flex flex-col items-center">
                      <QRCodeSVG value={`${window.location.origin}/score/final/${m.id}`} size={100} level="M" />
                      <div className="text-black text-[10px] text-center mt-2 font-bold leading-tight">
                        {teams.find(t => t.id === m.a)?.name}<br/>vs<br/>{teams.find(t => t.id === m.b)?.name}
                      </div>
                    </div>
                  ))}
                  {mainBracket?.thirdPlaceMatch && mainBracket.thirdPlaceMatch.a && mainBracket.thirdPlaceMatch.b && !mainBracket.thirdPlaceMatch.done && (
                    <div className="bg-white p-2 rounded-lg flex flex-col items-center border-2 border-orange-500">
                      <QRCodeSVG value={`${window.location.origin}/score/final/${mainBracket.thirdPlaceMatch.id}`} size={100} level="M" />
                      <div className="text-black text-[10px] text-center mt-2 font-bold leading-tight text-orange-600">
                        Petite Finale<br/>
                        {teams.find(t => t.id === mainBracket.thirdPlaceMatch?.a)?.name}<br/>vs<br/>{teams.find(t => t.id === mainBracket.thirdPlaceMatch?.b)?.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-center text-pink-400 font-bold uppercase tracking-wider mb-4 border-b border-bowling-line pb-2">Consolante</h4>
                <div className="grid grid-cols-2 gap-4">
                  {consBracket?.rounds.flat().filter(m => m.a && m.b && !m.done).map((m) => (
                    <div key={m.id} className="bg-white p-2 rounded-lg flex flex-col items-center">
                      <QRCodeSVG value={`${window.location.origin}/score/final/${m.id}`} size={100} level="M" />
                      <div className="text-black text-[10px] text-center mt-2 font-bold leading-tight">
                        {teams.find(t => t.id === m.a)?.name}<br/>vs<br/>{teams.find(t => t.id === m.b)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};