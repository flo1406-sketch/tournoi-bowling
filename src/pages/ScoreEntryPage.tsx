import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { ScoreInput } from '../components/ScoreInput';

export const ScoreEntryPage = () => {
  const { poolId } = useParams();
  const { pools, poolMatches, teams } = useTournamentStore();
  const [isLoading, setIsLoading] = useState(true);

  // On attend 2,5 secondes pour laisser le temps à Supabase de répondre
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bowling-dark flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-bowling-neon border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-bowling-neon font-bold animate-pulse">Connexion au tournoi...</p>
      </div>
    );
  }

  // Si après 2,5 secondes, il n'y a toujours aucune poule
  if (pools.length === 0) {
    return (
      <div className="min-h-screen bg-bowling-dark p-8 text-center flex flex-col items-center justify-center">
        <h1 className="text-white text-xl font-bold mb-4">Aucune poule trouvée</h1>
        <p className="text-slate-400 mb-6">Les données du tournoi ne sont pas encore disponibles. Avez-vous lancé le tournoi sur l'ordinateur principal ?</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Actualiser la page</button>
      </div>
    );
  }

  const pool = pools.find(p => p.id === poolId);
  
  if (!pool) {
    return (
      <div className="min-h-screen bg-bowling-dark p-8 text-center flex flex-col items-center justify-center">
        <h1 className="text-white text-xl font-bold mb-4">Poule introuvable</h1>
        <p className="text-slate-400">Cette poule n'existe pas ou a été supprimée.</p>
      </div>
    );
  }

  const matches = poolMatches.filter(m => m.poolId === poolId);

  return (
    <div className="min-h-screen bg-bowling-dark p-4 max-w-lg mx-auto">
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-black text-white">{pool.name}</h1>
        <p className="text-bowling-neon text-sm uppercase tracking-widest mt-1">Saisie des scores</p>
      </div>

      <div className="space-y-4">
        {matches.map(m => (
          <div key={m.id} className={`panel ${m.done ? 'border-green-500/50' : 'border-bowling-line'}`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex-1 text-right font-bold text-white">{teams.find(t => t.id === m.a)?.name}</div>
              <div className="text-slate-500 font-bold">vs</div>
              <div className="flex-1 text-left font-bold text-white">{teams.find(t => t.id === m.b)?.name}</div>
            </div>
            
            <div className="flex justify-center">
               <ScoreInput matchId={m.id} initialSa={m.sa} initialSb={m.sb} done={m.done} />
            </div>
            
            {m.done && <div className="text-center text-xs text-green-400 mt-2">Match validé</div>}
          </div>
        ))}
      </div>

      <div className="text-center mt-8 pb-8">
        <Link to="/" className="text-sm text-slate-500 underline hover:text-white">Retour à l'application</Link>
      </div>
    </div>
  );
};