import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { roundName } from '../utils/tournamentLogic';
import type { Bracket, BracketMatch, Target } from '../types';
import { ScoreInput } from '../components/ScoreInput';
import { Button } from '../components/Button';

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
  const { teams } = useTournamentStore();
  if (!bracket.thirdPlaceMatch) return null;

  const m = bracket.thirdPlaceMatch;
  const winA = m.done && m.winner === m.a;
  const winB = m.done && m.winner === m.b;

  return (
    <div className="bg-black/30 border border-orange-500/30 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">🥉 Petite Finale (Match pour la 3ème place)</h4>
      <div className="flex items-center justify-between gap-4">
        <div className={`flex-1 text-center font-bold ${winA ? 'text-bowling-neon' : ''}`}>
          {teams.find(t => t.id === m.a)?.name}
        </div>
        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg">
          <ScoreInput matchId={m.id} initialSa={m.sa} initialSb={m.sb} done={m.done} />
        </div>
        <div className={`flex-1 text-center font-bold ${winB ? 'text-bowling-neon' : ''}`}>
          {teams.find(t => t.id === m.b)?.name}
        </div>
      </div>
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
  const { teams } = useTournamentStore();
  const colorClass = getRoundColor(roundIndex, totalRounds);
  const canEdit = isEditMode && roundIndex === 0 && !match.done;

  const slotA = roundIndex === 0 ? matchNumber * 2 - 2 : null;
  const slotB = roundIndex === 0 ? matchNumber * 2 - 1 : null;

  const isSelA = canEdit && selectedSlot?.brKey === brKey && selectedSlot?.idx === slotA;
  const isSelB = canEdit && selectedSlot?.brKey === brKey && selectedSlot?.idx === slotB;

  // On cherche si ce match est assigné à une cible
  const currentTarget = targets.find(t => t.matchId === match.id);
  const canAssignTarget = match.a && match.b && !match.done && !isEditMode;

  return (
    <div className={`relative p-2 rounded border ${colorClass} transition-all ${canEdit ? 'hover:border-bowling-neon cursor-pointer' : ''}`}>
      
      {/* En-tête de la carte : Match X + Attribution Cible */}
      <div className="flex justify-between items-center mb-1">
        <div className="text-[10px] text-slate-400 font-bold uppercase">
          Match {matchNumber}
          {canEdit && <span className="text-bowling-neon ml-2">✏</span>}
          {match.bye && <span className="text-green-400 ml-2">BYE</span>}
        </div>

        {/* Menu déroulant d'attribution de cible */}
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
        className={`flex items-center justify-between gap-2 text-sm p-1 rounded ${match.winner === match.a ? 'text-bowling-neon font-bold' : ''} ${isSelA ? 'bg-bowling-neon/30 outline outline-1 outline-bowling-neon' : ''}`}
        onClick={() => canEdit && slotA !== null && onSelectSlot(brKey, slotA)}
      >
        <span className="truncate">{match.a ? teams.find(t => t.id === match.a)?.name : '— (vide)'}</span>
      </div>
      
      <div 
        className={`flex items-center justify-between gap-2 text-sm p-1 mt-1 rounded ${match.winner === match.b ? 'text-bowling-neon font-bold' : ''} ${isSelB ? 'bg-bowling-neon/30 outline outline-1 outline-bowling-neon' : ''}`}
        onClick={() => canEdit && slotB !== null && onSelectSlot(brKey, slotB)}
      >
        <span className="truncate">{match.b ? teams.find(t => t.id === match.b)?.name : '— (vide)'}</span>
      </div>
      
      {match.a && match.b && !isEditMode && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-center">
          <ScoreInput matchId={match.id} initialSa={match.sa} initialSb={match.sb} done={match.done} />
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
  return (
    <div className="panel overflow-hidden mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">{bracket.name}</h3>
        <span className="text-sm text-slate-400">{bracket.size} joueurs</span>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-6">
        {bracket.rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col gap-4 min-w-[230px]"> {/* Un peu plus large pour le select */}
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
  const { mainBracket, consBracket, swapBracketSlots, targets, assignTarget } = useTournamentStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ brKey: string; idx: number } | null>(null);

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Phase finale</h2>
        <Button 
          variant={isEditMode ? 'danger' : 'primary'} 
          onClick={() => {
            setIsEditMode(!isEditMode);
            setSelectedSlot(null);
          }}
        >
          {isEditMode ? '✕ Quitter l\'édition' : '✏ Modifier les placements'}
        </Button>
      </div>

      {isEditMode && (
        <div className="p-3 bg-bowling-neon/10 border border-bowling-neon/30 rounded-lg text-sm text-bowling-neon flex items-center justify-between mb-6">
          <span>Clique sur un joueur (ou une case vide) du 1er tour, puis sur un autre pour les échanger.</span>
          {selectedSlot && <Button size="sm" variant="ghost" onClick={() => setSelectedSlot(null)}>Annuler</Button>}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Tableau Principal */}
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

        {/* Tableau Consolante */}
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
    </div>
  );
};