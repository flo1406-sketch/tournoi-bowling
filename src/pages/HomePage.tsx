import { Link, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';

export const HomePage = () => {
  const { teams, pools, mainBracket, generateDemo, appLogo } = useTournamentStore();
  const navigate = useNavigate();

  const handleDemo = () => {
    if (window.confirm("Générer une démo (19 joueurs, 90% des scores de poules) ? Cela effacera le tournoi actuel.")) {
      generateDemo();
      navigate('/poules');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 👇 LE HERO AVEC LE LOGO DU CLUB 👇 */}
      <div className="panel text-center py-12 relative overflow-hidden flex flex-col items-center">
        
        {/* Effet de halo lumineux en arrière-plan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-bowling-neon/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-bowling-pink/20 blur-[60px] rounded-full pointer-events-none"></div>

        {/* Affichage du Logo */}
        <div className="relative mb-6 z-10">
          {appLogo ? (
            <img 
              src={appLogo} 
              alt="Logo du Club" 
              className="w-32 h-32 object-contain rounded-2xl shadow-[0_0_30px_rgba(0,243,255,0.3)] bg-black/20 p-2 border border-bowling-line" 
            />
          ) : (
            <div className="w-32 h-32 bg-red-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-red-500/50">
              <span className="text-6xl font-black leading-none">B</span>
              <span className="text-xs font-bold text-center leading-tight mt-1">BOWLING<br/>LIMOGES NORD</span>
            </div>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-4 relative z-10 text-white">
          Tournoi du <span className="bg-gradient-to-r from-bowling-neon to-bowling-pink bg-clip-text text-transparent">Bowling</span>
        </h1>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto relative z-10 text-sm md:text-base">
          Organisé par le <strong className="text-white">Bowling Limoges Nord</strong>.<br/>
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