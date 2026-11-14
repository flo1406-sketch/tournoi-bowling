import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTournamentStore } from '../store/useTournamentStore';
import { getPoolStandings, computeAutoSplit } from '../utils/tournamentLogic';
import { ScoreInput } from '../components/ScoreInput';
import { Button } from '../components/Button';

export const PoolsPage = () => {
  const navigate = useNavigate();
  const { pools, poolMatches, teams, config, generateFinals, movePlayerToPool } = useTournamentStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const split = computeAutoSplit(pools, poolMatches, teams, config.qualifyCount);

  const handleGenerateFinals = () => {
    if (split.qualifies.length < 2) {
      alert("Il faut au moins 2 joueurs qualifiés pour le tableau principal.");
      return;
    }

    let msg = "📊 RÉPARTITION DE LA PHASE FINALE\n\n";
    msg += `🏆 TABLEAU PRINCIPAL (${split.qualifies.length}) :\n`;
    msg += split.qualifies.map(id => `   • ${teams.find(t => t.id === id)?.name}`).join("\n") + "\n\n";
    msg += `🥈 CONSOLANTE (${split.consolante.length}) :\n`;
    msg += split.consolante.map(id => `   • ${teams.find(t => t.id === id)?.name}`).join("\n") + "\n\n";
    
    if (split.restants > 0) {
      msg += `⚠ ${split.restants} match(s) de poule non joué(s).\n`;
      msg += "Le classement est provisoire.\n\n";
    }
    msg += "Confirmer la génération ?";

    if (window.confirm(msg)) {
      generateFinals();
      navigate('/finale');
    }
  };

  if (!pools.length) {
    return (
      <div className="panel text-center py-12">
        <h2 className="text-xl font-bold mb-4">Aucune poule générée</h2>
        <p className="text-slate-400 mb-6">Retourne au paramétrage pour générer les poules.</p>
        <Link to="/parametrage" className="btn btn-primary">Aller au paramétrage</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Phase de poules</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => setShowQR(true)}>
            📱 QR Codes
          </Button>
          <Button 
            variant={isEditMode ? 'danger' : 'ghost'} 
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? '✕ Terminer l\'édition' : '✏️ Modifier les poules'}
          </Button>
          <Button variant="primary" onClick={handleGenerateFinals}>
            Générer la phase finale →
          </Button>
        </div>
      </div>

      {isEditMode && (
        <div className="p-3 bg-bowling-neon/10 border border-bowling-neon/30 rounded-lg text-sm text-bowling-neon">
          ⚠️ <b>Mode édition :</b> Utilise les menus déroulants pour changer un joueur de poule. 
          Attention, cela <b>réinitialisera les scores</b> des matchs des poules concernées.
        </div>
      )}

      {/* Aperçu répartition */}
      <div className="panel border-l-4 border-l-bowling-neon">
        <h3 className="text-lg font-bold mb-4">Aperçu de la répartition</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-black/20 rounded-lg">
            <h4 className="text-sm font-bold text-green-400 mb-2">🏆 Principal ({split.qualifies.length})</h4>
            <ul className="space-y-1 text-sm">
              {split.qualifies.length === 0 ? (
                <li className="text-slate-500 italic">Aucun qualifié pour l'instant</li>
              ) : (
                split.qualifies.map(id => (
                  <li key={id} className="flex items-center gap-2">
                    <span className="badge-team">#{teams.findIndex(t => t.id === id) + 1}</span>
                    {teams.find(t => t.id === id)?.name}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="p-3 bg-black/20 rounded-lg">
            <h4 className="text-sm font-bold text-pink-400 mb-2">🥈 Consolante ({split.consolante.length})</h4>
            <ul className="space-y-1 text-sm">
              {split.consolante.length === 0 ? (
                <li className="text-slate-500 italic">Aucun joueur pour l'instant</li>
              ) : (
                split.consolante.map(id => (
                  <li key={id} className="flex items-center gap-2">
                    <span className="badge-team">#{teams.findIndex(t => t.id === id) + 1}</span>
                    {teams.find(t => t.id === id)?.name}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Poules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pools.map(pool => {
          const standings = getPoolStandings(pool, poolMatches, teams);
          const matches = poolMatches.filter(m => m.poolId === pool.id);

          return (
            <div key={pool.id} className="panel">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{pool.name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-bowling-neon/10 text-bowling-neon">
                  {pool.teamIds.length} joueurs
                </span>
              </div>

              {isEditMode ? (
                /* === VUE ÉDITION === */
                <div className="space-y-2 mb-4">
                  {pool.teamIds.map(playerId => {
                    const player = teams.find(t => t.id === playerId);
                    return (
                      <div key={playerId} className="flex items-center gap-2 bg-black/20 p-2 rounded border border-bowling-line">
                        <span className="flex-1 font-semibold text-sm">{player?.name}</span>
                        <select
                          value={pool.id}
                          onChange={(e) => movePlayerToPool(playerId, e.target.value || null)}
                          className="input-field text-xs py-1"
                        >
                          {pools.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="">(Retirer)</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* === VUE NORMALE (Classement + Matchs) === */
                <>
                  <table className="w-full text-sm mb-6">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase border-b border-bowling-line">
                        <th className="text-left py-2">#</th>
                        <th className="text-left py-2">Joueur</th>
                        <th className="text-center py-2">J</th>
                        <th className="text-center py-2">V</th>
                        <th className="text-center py-2">D</th>
                        <th className="text-center py-2">+/-</th>
                        <th className="text-center py-2 text-bowling-neon">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, idx) => {
                        const isMain = split.qualifies.includes(row.id);
                        return (
                          <tr key={row.id} className={`border-b border-bowling-line/50 ${isMain ? 'bg-green-900/10' : ''}`}>
                            <td className="py-2 text-slate-500">{idx + 1}</td>
                            <td className="py-2 font-semibold">{teams.find(t => t.id === row.id)?.name}</td>
                            <td className="text-center">{row.played}</td>
                            <td className="text-center">{row.w}</td>
                            <td className="text-center">{row.l}</td>
                            <td className="text-center">{row.lf - row.la > 0 ? '+' : ''}{row.lf - row.la}</td>
                            <td className="text-center font-bold text-bowling-neon">{row.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="space-y-2">
                    {matches.map(m => (
                      <div key={m.id} className={`flex items-center justify-between gap-2 p-2 rounded border ${m.done ? 'bg-green-900/10 border-green-500/20' : 'border-bowling-line'}`}>
                        <span className="flex-1 text-sm truncate">{teams.find(t => t.id === m.a)?.name}</span>
                        <ScoreInput 
                          matchId={m.id} 
                          initialSa={m.sa} 
                          initialSb={m.sb} 
                          done={m.done} 
                        />
                        <span className="flex-1 text-sm truncate text-right">{teams.find(t => t.id === m.b)?.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL QR CODES */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-bowling-panel border border-bowling-line rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Scannez pour saisir les scores</h3>
              <Button variant="danger" size="sm" onClick={() => setShowQR(false)}>Fermer</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map(pool => (
                <div key={pool.id} className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
                  <QRCodeSVG 
                    value={`${window.location.origin}/score/${pool.id}`} 
                    size={160}
                    level="H"
                  />
                  <div className="text-black font-black text-lg mt-4">{pool.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};