import { useRef } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const SettingsPage = () => {
  const { 
    config, setConfig, teams, generatePools, 
    targets, addTarget, removeTarget, updateTargetLabel,
    pools, poolMatches, mainBracket, consBracket, manualQualification
  } = useTournamentStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const stateToExport = {
      teams, pools, poolMatches, mainBracket, consBracket, targets, config, manualQualification
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tournoi-bowling-sauvegarde-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsedData = JSON.parse(e.target?.result as string);
          if (!parsedData.teams || !parsedData.config) {
            alert("Fichier invalide. Ce n'est pas une sauvegarde de tournoi.");
            return;
          }
          if (window.confirm("⚠️ Importer cette sauvegarde va ÉCRASER le tournoi actuel. Continuer ?")) {
            useTournamentStore.setState(parsedData);
            alert("Sauvegarde importée avec succès !");
          }
        } catch (error) {
          alert("Erreur lors de la lecture du fichier JSON.");
        }
      };
    }
  };

  return (
    // 👇 On enlève la limite de largeur (max-w-4xl) pour prendre toute la place 👇
    <div className="space-y-6 w-full">
      
      {/* Grille de réglages (2 colonnes sur grand écran) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Colonne de gauche */}
        <div className="space-y-6">
          {/* FORMAT DES POULES */}
          <div className="panel">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>⚙️</span> Format des Poules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Joueurs par poule (visé)</label>
                <select value={config.poolSize} onChange={(e) => setConfig('poolSize', parseInt(e.target.value))} className="input-field w-full text-lg">
                  {[3, 4, 5, 6].map(v => <option key={v} value={v}>{v} joueurs</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qualifiés par poule</label>
                <select value={config.qualifyCount} onChange={(e) => setConfig('qualifyCount', parseInt(e.target.value))} className="input-field w-full text-lg">
                  {[1, 2, 3].map(v => <option key={v} value={v}>{v} joueur(s)</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legs pour gagner (Poule)</label>
                <input type="number" value={config.legsToWinPool} onChange={(e) => setConfig('legsToWinPool', parseInt(e.target.value))} className="input-field w-full text-lg" min={1} max={9} />
              </div>
            </div>
          </div>

          {/* SAUVEGARDE */}
          <div className="panel border-l-4 border-l-bowling-neon flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span>💾</span> Sauvegarde & Restauration
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Téléchargez une copie de votre tournoi sur votre appareil, ou restaurez une sauvegarde précédente.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary" onClick={handleExport} className="flex-1">
                ⭳ Exporter (JSON)
              </Button>
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="flex-1">
                ⭱ Importer
              </Button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
            </div>
          </div>
        </div>

        {/* Colonne de droite */}
        <div className="space-y-6">
          {/* FORMAT PHASE FINALE */}
          <div className="panel">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>🏆</span> Format de la Phase Finale
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
                <h3 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wide">Principal</h3>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legs pour gagner</label>
                <input type="number" value={config.legsToWinMain} onChange={(e) => setConfig('legsToWinMain', parseInt(e.target.value))} className="input-field w-full text-lg" min={1} max={9} />
              </div>
              <div className="p-4 bg-pink-900/10 border border-pink-500/20 rounded-lg">
                <h3 className="text-sm font-bold text-pink-400 mb-3 uppercase tracking-wide">Consolante</h3>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legs pour gagner</label>
                <input type="number" value={config.legsToWinCons} onChange={(e) => setConfig('legsToWinCons', parseInt(e.target.value))} className="input-field w-full text-lg" min={1} max={9} />
              </div>
            </div>
          </div>

          {/* CIBLES */}
          <div className="panel">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>🎯</span> Gestion des cibles
                </h2>
              </div>
              <Button variant="primary" size="sm" onClick={addTarget}>
                + Ajouter
              </Button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {targets.map((target) => (
                <div key={target.id} className="p-2 bg-black/20 border border-bowling-line rounded-lg flex flex-col gap-1 relative group">
                  <button onClick={() => removeTarget(target.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">✕</button>
                  <input type="text" value={target.label} onChange={(e) => updateTargetLabel(target.id, e.target.value)} className="input-field w-full text-center font-bold text-bowling-neon text-lg py-1 px-0" placeholder="N°" maxLength={5} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOUTON GÉNÉRATION (en bas, pleine largeur) */}
      <div className="panel flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-bowling-panel to-bowling-dark border-t-4 border-t-bowling-neon">
        <div>
          <div className="text-2xl font-black text-white">
            {teams.length} joueur{teams.length > 1 ? 's' : ''} prêt{teams.length > 1 ? 's' : ''}
          </div>
          <div className="text-sm text-slate-400">Tout est configuré ? Lance les poules !</div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/inscriptions" className="btn flex-1 text-center md:flex-none py-3 px-6 text-base">
            ← Retour aux Inscriptions
          </Link>
          <Button
            variant="primary"
            onClick={() => { generatePools(); window.location.href = '/poules'; }}
            disabled={teams.length < 4}
            className="flex-1 md:flex-none py-3 px-8 text-base shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          >
            ⚡ Générer les poules
          </Button>
        </div>
      </div>
    </div>
  );
};