import { useParams, Link } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { ScoreInput } from '../components/ScoreInput';
import type { BracketMatch } from '../types';

export const ScoreEntryFinalPage = () => {
  const { matchId } = useParams();
  const { mainBracket, consBracket, teams } = useTournamentStore();

  let match: BracketMatch | null | undefined = mainBracket?.rounds.flat().find(m => m.id === matchId);
  let matchLabel = "Tableau Principal";

  if (!match) {
    match = consBracket?.rounds.flat().find(m => m.id === matchId);
    matchLabel = "Consolante";
  }

  if (!match && mainBracket?.thirdPlaceMatch?.id === matchId) {
    match = mainBracket?.thirdPlaceMatch || undefined;
    matchLabel = "Petite Finale";
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-bowling-dark p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-white text-xl font-bold mb-4">Match introuvable</h1>
        <p className="text-slate-400 mb-8">Ce match n'est pas encore prêt ou a été supprimé.</p>
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  const playerA = teams.find(t => t.id === match?.a)?.name || '—';
  const playerB = teams.find(t => t.id === match?.b)?.name || '—';

  return (
    <div className="min-h-screen bg-bowling-dark p-4 flex flex-col justify-center max-w-lg mx-auto">
      <div className="text-center mb-10">
        <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${matchLabel === 'Consolante' ? 'bg-pink-900/40 text-pink-400' : 'bg-green-900/40 text-green-400'}`}>
          {matchLabel}
        </div>
        <h1 className="text-3xl font-black text-white">Saisie du score</h1>
      </div>

      <div className="panel border-bowling-line p-8 flex flex-col gap-6 shadow-2xl relative">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xl font-bold text-white flex-1 truncate">{playerA}</span>
          <div className="scale-125">
            <ScoreInput 
              matchId={match.id} 
              initialSa={match.sa} 
              initialSb={match.sb} 
              done={match.done} 
            />
          </div>
          <span className="text-xl font-bold text-white flex-1 truncate text-right">{playerB}</span>
        </div>

        <div className="text-center text-xs text-slate-500 mt-4">
          Cliquez sur les cases pour modifier le score.
        </div>
        
        {match.done && (
          <div className="text-center text-sm text-green-400 mt-4 font-bold border border-green-500/30 bg-green-900/20 py-2 rounded">
            ✓ Match validé
          </div>
        )}
      </div>

      <div className="text-center mt-12">
        <Link to="/" className="text-sm text-slate-500 underline hover:text-white transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};