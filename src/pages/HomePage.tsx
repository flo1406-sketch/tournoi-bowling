import { Link, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';

export const HomePage = () => {
  const { teams, pools, mainBracket, generateDemo, appLogo, appTitle, appSubtitle } = useTournamentStore();
  const navigate = useNavigate();

  const handleDemo = () => {
    if (window.confirm("Générer une démo (19 joueurs, 90% des scores de poules) ? Cela effacera le tournoi actuel.")) {
      generateDemo();
      navigate('/poules');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 👇 LE HERO DYNAMIQUE 👇 */}
      <div className="panel text-center py-12 relative overflow-hidden flex flex-col items-center">
        
        {/* Effet de halo lumineux */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-bowling-neon/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-bowling-pink/20 blur-[60px] rounded-full pointer-events-none"></div>

        {/* Affichage du Logo (Celui que tu as uploadé, ou une cible par défaut) */}
        <div className="relative mb-6 z-10">
          {appLogo ? (
            <img 
              src={appLogo} 
              alt="Logo" 
              className="w-32 h-32 object-contain rounded-2xl shadow-[0_0_30px_rgba(0,243,255,0.3)] bg-black/20 p-2 border border-bowling-line" 
            />
          ) : (
            <div className="w-32 h-32 bg-bowling-panel rounded-2xl flex flex-col items-center justify-center text-bowling-neon shadow-[0_0_30px_rgba(0,243,255,0.3)] border border-bowling-line">
              <span className="text-6xl leading-none">🎯</span>
            </div>
          )}
        </div>

        {/* Titre et Sous-titre Dynamiques */}
        <h1 className="text-4xl md:text-5xl font-black mb-2 relative z-10 text-white">
          {appTitle}
        </h1>
        <h2 className="text-lg md:text-xl font-bold mb-6 relative z-10 text-bowling-neon tracking-widest uppercase">
          {appSubtitle}
        </h2>
        
        <p className="text-slate-400 mb-8 max-w-lg mx-auto relative z-10 text-sm md:text-base">
          Inscrivez les joueurs, générez les poules et suivez les matchs sur les cibles en temps réel.
        </p>
        
        <div className="flex justify-center gap-4 relative z-10">
          <Link to="/inscriptions" className="btn btn-primary px-8 py-3 text-base">Commencer les inscriptions</Link>
          {mainBracket && <Link to="/finale" className="btn px-8 py-3 text-base">Voir la phase finale</Link>}
        </div>
      </div>

      {/* Les 3 cartes de stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel text-center border-t-4 border-t-bowling-neon">
          <div className="text-4xl font-black text-white mb-2">{teams.length}</div>
          <div className="text-sm text-bowling-neon uppercase tracking-wider font-bold">Joueurs inscrits</div>
        </div>
        <div className="panel text-center border-t-4 border-t-bowling-pink">
          <div className="text-4xl font-black text-white mb-2">{pools.length}</div>
          <div className="text-sm text-bowling-pink uppercase tracking-wider font-bold">Poules générées</div>
        </div>
        <div className="panel text-center border-t-4 border-t-yellow-500">
          <div className="text-4xl font-black text-white mb-2">{mainBracket ? 'Oui' : 'Non'}</div>
          <div className="text-sm text-yellow-500 uppercase tracking-wider font-bold">Phase finale prête</div>
        </div>
      </div>

      {/* Mode Démo (pour toi) */}
      <div className="text-center mt-12 opacity-40 hover:opacity-100 transition-opacity">
        <div className="inline-block p-3 border border-dashed border-slate-600 rounded-xl">
          <Button variant="ghost" size="sm" onClick={handleDemo}>
            🛠 Mode Démo (Vidéo)
          </Button>
        </div>
      </div>
    </div>
  );
};