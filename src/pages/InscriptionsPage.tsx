import { useState } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';

export const InscriptionsPage = () => {
  const { teams, addTeam, removeTeam, moveTeam, setTeamNumber } = useTournamentStore();
  const [newPlayer, setNewPlayer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 👈 Empêche le rechargement de la page
    if (newPlayer.trim()) {
      addTeam(newPlayer.trim());
      setNewPlayer('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Joueurs inscrits</h2>
          <span className="text-sm px-3 py-1 rounded-full bg-bowling-neon/10 text-bowling-neon border border-bowling-neon/20">
            {teams.length} joueur{teams.length > 1 ? 's' : ''}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            placeholder="Nom du joueur..."
            className="input-field flex-1"
            maxLength={40}
          />
          <Button type="submit" variant="primary">+ Inscrire</Button>
        </form>

        {teams.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Aucun joueur inscrit pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team, index) => (
              <li key={team.id} className="flex items-center gap-3 p-3 bg-black/20 border border-bowling-line rounded-lg">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveTeam(team.id, -1)} disabled={index === 0} className="text-xs text-slate-500 hover:text-white disabled:opacity-20">▲</button>
                  <button onClick={() => moveTeam(team.id, 1)} disabled={index === teams.length - 1} className="text-xs text-slate-500 hover:text-white disabled:opacity-20">▼</button>
                </div>
                <input
                  type="number"
                  value={index + 1}
                  onChange={(e) => setTeamNumber(team.id, parseInt(e.target.value))}
                  className="input-field w-16 text-center text-bowling-pink font-bold"
                  min={1}
                  max={teams.length}
                />
                <span className="flex-1 font-semibold">{team.name}</span>
                <button onClick={() => removeTeam(team.id)} className="text-slate-500 hover:text-red-400">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};