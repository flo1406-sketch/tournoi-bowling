import { useTournamentStore } from '../store/useTournamentStore';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const SettingsPage = () => {
  const { 
    config, setConfig, teams, generatePools, 
    targets, addTarget, removeTarget, updateTargetLabel 
  } = useTournamentStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* ==================== SECTION FORMAT ==================== */}
      <div className="panel">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span>⚙️</span> Format des Poules
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Joueurs par poule (visé)
            </label>
            <select
              value={config.poolSize}
              onChange={(e) => setConfig('poolSize', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[3, 4, 5, 6].map(v => <option key={v} value={v}>{v} joueurs</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Qualifiés par poule
            </label>
            <select
              value={config.qualifyCount}
              onChange={(e) => setConfig('qualifyCount', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[1, 2, 3].map(v => <option key={v} value={v}>{v} joueur(s)</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Legs pour gagner (Poule)
            </label>
            <input
              type="number"
              value={config.legsToWinPool}
              onChange={(e) => setConfig('legsToWinPool', parseInt(e.target.value))}
              className="input-field w-full"
              min={1} max={9}
            />
          </div>
        </div>
      </div>

      {/* ==================== SECTION PHASE FINALE ==================== */}
      <div className="panel">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span>🏆</span> Format de la Phase Finale
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
            <h3 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wide">Tableau Principal</h3>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Legs pour gagner
            </label>
            <input
              type="number"
              value={config.legsToWinMain}
              onChange={(e) => setConfig('legsToWinMain', parseInt(e.target.value))}
              className="input-field w-full"
              min={1} max={9}
            />
          </div>

          <div className="p-4 bg-pink-900/10 border border-pink-500/20 rounded-lg">
            <h3 className="text-sm font-bold text-pink-400 mb-3 uppercase tracking-wide">Consolante</h3>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Legs pour gagner
            </label>
            <input
              type="number"
              value={config.legsToWinCons}
              onChange={(e) => setConfig('legsToWinCons', parseInt(e.target.value))}
              className="input-field w-full"
              min={1} max={9}
            />
          </div>
        </div>
      </div>

      {/* ==================== SECTION CIBLES ==================== */}
      <div className="panel">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🎯</span> Gestion des cibles
            </h2>
            <p className="text-sm text-slate-400">Ajoutez, retirez ou renommez les cibles.</p>
          </div>
          <Button variant="primary" size="sm" onClick={addTarget}>
            + Ajouter
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {targets.map((target) => (
            <div key={target.id} className="p-3 bg-black/20 border border-bowling-line rounded-lg flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Cible</span>
                <button 
                  onClick={() => removeTarget(target.id)}
                  className="text-slate-500 hover:text-red-400 text-xs"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={target.label}
                onChange={(e) => updateTargetLabel(target.id, e.target.value)}
                className="input-field w-full text-center font-bold text-bowling-neon"
                placeholder="N°"
                maxLength={5}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ==================== BOUTON GÉNÉRATION ==================== */}
      <div className="panel flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-bowling-panel to-bowling-dark">
        <div>
          <div className="text-lg font-bold text-white">
            {teams.length} joueur{teams.length > 1 ? 's' : ''} prêt{teams.length > 1 ? 's' : ''}
          </div>
          <div className="text-sm text-slate-400">Prêt à lancer les poules ?</div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/inscriptions" className="btn flex-1 text-center md:flex-none">
            ← Inscriptions
          </Link>
          <Button
            variant="primary"
            onClick={() => { generatePools(); window.location.href = '/poules'; }}
            disabled={teams.length < 4}
            className="flex-1 md:flex-none"
          >
            ⚡ Générer les poules
          </Button>
        </div>
      </div>
    </div>
  );
};