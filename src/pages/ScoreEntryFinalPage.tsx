import { useParams, Link } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { ScoreInput } from '../components/ScoreInput';
import type { BracketMatch } from '../types'; // 👈 Import du type

export const ScoreEntryFinalPage = () => {
  const { matchId } = useParams();
  const { mainBracket, consBracket, teams } = useTournamentStore();

  // 👇 On autorise null dans le type
  let match: BracketMatch | null | undefined = mainBracket?.rounds.flat().find(m => m.id === matchId);
  let matchLabel = "Tableau Principal";

  if (!match) {
    match = consBracket?.rounds.flat().find(m => m.id === matchId);
    matchLabel = "Consolante";
  }

  // 👇 On sécurise avec ?. 
    if (!match && mainBracket?.thirdPlaceMatch?.id === matchId) {
    match = mainBracket?.thirdPlaceMatch; // 👈 Ajout du ? ici
    matchLabel = "Petite Finale";
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-bowling-dark p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-white text-xl font-bold mb-4">Match introuvable</h1>
        <Link to="/" className="btn btn-primary">Retour</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bowling-dark p-4 max-w-lg mx-auto">
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-black text-white">{matchLabel}</h1>
        <p className="text-bowling-neon text-sm uppercase tracking-widest mt-1">Saisie du score</p>
      </div>

      <div className="panel border-bowling-line p-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex-1 text-right font-bold text-lg text-white">
            {teams.find(t => t.id === match?.a)?.name || '—'}
          </div>
          <div className="text-slate-500 font-black text-xl">VS</div>
          <div className="flex-1 text-left font-bold text-lg text-white">
            {teams.find(t => t.id === match?.b)?.name || '—'}
          </div>
        </div>

        <div className="flex justify-center scale-125">
          <ScoreInput matchId={match.id} initialSa={match.sa} initialSb={match.sb} done={match.done} />
        </div>
        
        {match.done && (
          <div className="text-center text-sm text-green-400 mt-8 font-bold border border-green-500/30 bg-green-900/20 py-2 rounded">
            ✓ Match validé
          </div>
        )}
      </div>

      <div className="text-center mt-8">
        <Link to="/" className="text-sm text-slate-500 underline hover:text-white">Retour</Link>
      </div>
    </div>
  );
};