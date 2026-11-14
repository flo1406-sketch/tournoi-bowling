import { useTournamentStore } from '../store/useTournamentStore';
import { computeGlobalStats } from '../utils/tournamentLogic';
import { Link } from 'react-router-dom';

export const StatsPage = () => {
  const { teams, poolMatches, mainBracket, consBracket } = useTournamentStore();
  const stats = computeGlobalStats(teams, poolMatches, mainBracket, consBracket);

  if (!stats.length || stats.every(s => s.played === 0)) {
    return (
      <div className="panel text-center py-12">
        <h2 className="text-xl font-bold mb-4">Aucun match joué</h2>
        <p className="text-slate-400 mb-6">Saisis des scores dans les poules ou les tableaux pour voir le classement.</p>
        <Link to="/poules" className="btn btn-primary">Aller aux poules</Link>
      </div>
    );
  }

  // Calcul des records
  const bestAttack = [...stats].sort((a, b) => b.lf - a.lf)[0];
  const bestDefense = [...stats].sort((a, b) => a.la - b.la)[0];
  const bestDiff = [...stats].sort((a, b) => (b.lf - b.la) - (a.lf - a.la))[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Classement Général</h2>

      {/* Cartes de records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel border-l-4 border-l-bowling-neon">
          <h4 className="text-xs text-slate-400 uppercase font-bold">🎯 Meilleure attaque</h4>
          <div className="text-lg font-bold text-white mt-1">{bestAttack.name}</div>
          <div className="text-sm text-bowling-neon">{bestAttack.lf} legs marqués</div>
        </div>
        <div className="panel border-l-4 border-l-bowling-pink">
          <h4 className="text-xs text-slate-400 uppercase font-bold">🛡 Meilleure défense</h4>
          <div className="text-lg font-bold text-white mt-1">{bestDefense.name}</div>
          <div className="text-sm text-bowling-pink">{bestDefense.la} legs encaissés</div>
        </div>
        <div className="panel border-l-4 border-l-yellow-500">
          <h4 className="text-xs text-slate-400 uppercase font-bold">⚡ Meilleur différentiel</h4>
          <div className="text-lg font-bold text-white mt-1">{bestDiff.name}</div>
          <div className="text-sm text-yellow-400">{bestDiff.lf - bestDiff.la > 0 ? '+' : ''}{bestDiff.lf - bestDiff.la}</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase border-b border-bowling-line text-left">
              <th className="py-3 px-2">#</th>
              <th className="py-3 px-2">Joueur</th>
              <th className="text-center py-3 px-2">J</th>
              <th className="text-center py-3 px-2">V</th>
              <th className="text-center py-3 px-2">D</th>
              <th className="text-center py-3 px-2">Legs</th>
              <th className="text-center py-3 px-2">+/-</th>
              <th className="text-center py-3 px-2 text-bowling-neon">Pts</th>
              <th className="text-center py-3 px-2">Forme</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, idx) => (
              <tr key={s.id} className="border-b border-bowling-line/50 hover:bg-white/5">
                <td className="py-3 px-2 text-slate-500 font-bold">{idx + 1}</td>
                <td className="py-3 px-2 font-semibold text-white flex items-center gap-2">
                  <span className="badge-team">#{teams.findIndex(t => t.id === s.id) + 1}</span>
                  {s.name}
                </td>
                <td className="text-center">{s.played}</td>
                <td className="text-center">{s.w}</td>
                <td className="text-center">{s.l}</td>
                <td className="text-center">
                  <span className="text-green-400">{s.lf}</span> / <span className="text-red-400">{s.la}</span>
                </td>
                <td className="text-center font-bold">{s.lf - s.la > 0 ? '+' : ''}{s.lf - s.la}</td>
                <td className="text-center font-bold text-bowling-neon text-lg">{s.pts}</td>
                <td className="text-center">
                  <div className="flex gap-1 justify-center">
                    {s.form.slice(-5).map((res, i) => (
                      <span key={i} className={`w-2.5 h-2.5 rounded-full ${res === 'V' ? 'bg-green-500' : 'bg-red-500'}`} title={res === 'V' ? 'Victoire' : 'Défaite'} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};