import { useParams } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { ScoreInput } from '../components/ScoreInput';

export const ScoreEntryPage = () => {
  const { poolId } = useParams();
  const { pools, poolMatches, teams } = useTournamentStore();

  const pool = pools.find(p => p.id === poolId);
  const matches = poolMatches.filter(m => m.poolId === poolId);

  if (!pool) return <div className="p-8 text-center text-white">Poule introuvable.</div>;

  return (
    <div className="min-h-screen bg-bowling-dark p-4 max-w-lg mx-auto">
      <div className="text-center mb-6 pt-4">
        <h1 className="text-2xl font-black text-white">{pool.name}</h1>
        <p className="text-bowling-neon text-xs uppercase tracking-widest mt-1">Saisie des scores</p>
      </div>
      <div className="space-y-4">
        {matches.map(m => (
          <div key={m.id} className="panel border-bowling-line p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 text-right font-bold text-white">{teams.find(t => t.id === m.a)?.name}</div>
              <div className="px-4 text-slate-500 font-bold">vs</div>
              <div className="flex-1 text-left font-bold text-white">{teams.find(t => t.id === m.b)?.name}</div>
            </div>
            <div className="flex justify-center">
              <ScoreInput matchId={m.id} initialSa={m.sa} initialSb={m.sb} done={m.done} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};