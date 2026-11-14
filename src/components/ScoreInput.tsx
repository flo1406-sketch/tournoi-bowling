import { useState, useEffect } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from './Button';

interface ScoreInputProps {
  matchId: string;
  initialSa: number | null;
  initialSb: number | null;
  done: boolean;
}

export const ScoreInput = ({ matchId, initialSa, initialSb, done }: ScoreInputProps) => {
  const { commitScore, clearMatch } = useTournamentStore();
  // État local pour la saisie fluide
  const [sa, setSa] = useState<string>(initialSa !== null ? String(initialSa) : '');
  const [sb, setSb] = useState<string>(initialSb !== null ? String(initialSb) : '');

  // Synchronisation si le match change de l'extérieur
  useEffect(() => {
    setSa(initialSa !== null ? String(initialSa) : '');
    setSb(initialSb !== null ? String(initialSb) : '');
  }, [initialSa, initialSb]);

  const handleValidate = () => {
    const valA = parseInt(sa) || 0;
    const valB = parseInt(sb) || 0;
    if (valA === valB) {
      alert("Pas de match nul possible aux fléchettes !");
      return;
    }
    commitScore(matchId, valA, valB);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-bowling-neon w-6 text-center">{sa || 0}</span>
        <span className="text-slate-500">-</span>
        <span className="font-bold text-bowling-neon w-6 text-center">{sb || 0}</span>
        <button onClick={() => clearMatch(matchId)} className="ml-2 text-xs text-slate-500 hover:text-red-400" title="Modifier">↺</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        value={sa}
        onChange={(e) => setSa(e.target.value)}
        className="input-field w-12 text-center px-1 py-1"
        placeholder="0"
      />
      <span className="text-slate-500">-</span>
      <input
        type="number"
        min="0"
        value={sb}
        onChange={(e) => setSb(e.target.value)}
        className="input-field w-12 text-center px-1 py-1"
        placeholder="0"
      />
      <Button 
        size="sm" 
        variant="primary" 
        onClick={handleValidate}
        disabled={sa === '' || sb === ''}
        className="ml-1 px-2"
        title="Valider le score"
      >
        ✓
      </Button>
    </div>
  );
};