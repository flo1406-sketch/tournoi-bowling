import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { supabase } from '../lib/supabase';
import { ScoreInput } from '../components/ScoreInput';

export const ScoreEntryPage = () => {
  const { poolId } = useParams();
  const { pools, poolMatches, teams } = useTournamentStore();
  const [status, setStatus] = useState("Connexion à Supabase...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // On teste directement la connexion à Supabase
        const { data, error } = await supabase
          .from('tournament_sync')
          .select('*')
          .eq('id', 'current_tournament')
          .single();

        if (error) {
          setErrorMsg("Erreur Supabase : " + error.message);
          setStatus("Échec de la connexion");
        } else if (!data || !data.state) {
          setErrorMsg("La table existe, mais elle est vide. Avez-vous lancé le tournoi sur le PC ?");
          setStatus("Données vides");
        } else {
          setStatus("Données reçues !");
          setRawData(data.state);
          // On force la mise à jour du store local
          useTournamentStore.setState(data.state);
        }
      } catch (err: any) {
        setErrorMsg("Erreur critique : " + err.message);
        setStatus("Erreur");
      }
    };

    testConnection();
  }, []);

  // Écran de chargement / Erreur
  if (status !== "Données reçues !") {
    return (
      <div className="min-h-screen bg-bowling-dark p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-bowling-neon border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-white text-xl font-bold mb-2">{status}</h1>
        
        {errorMsg && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mt-4 text-sm max-w-md">
            {errorMsg}
          </div>
        )}

        <button onClick={() => window.location.reload()} className="btn btn-primary mt-8">
          Réessayer
        </button>
        
        <div className="mt-8 text-xs text-slate-500">
          ID de la poule demandée : {poolId}
        </div>
      </div>
    );
  }

  // Vérification de la poule
  const pool = pools.find(p => p.id === poolId);
  if (!pool) {
    return (
      <div className="min-h-screen bg-bowling-dark p-6 text-center">
        <h1 className="text-white text-xl font-bold mb-4 text-red-400">Poule introuvable dans les données</h1>
        <p className="text-slate-400 mb-4">Le téléphone a bien reçu les données de Supabase, mais il ne trouve pas de poule avec l'ID : <b>{poolId}</b></p>
        
        <div className="bg-black/50 p-4 rounded text-left text-xs text-slate-300 overflow-auto max-h-64 mb-6">
          <p className="font-bold mb-2">Poules reçues :</p>
          {pools.map(p => <div key={p.id}>- {p.id} ({p.name})</div>)}
        </div>

        <Link to="/" className="btn btn-primary">Retour</Link>
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