import { Link, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';
import { Button } from '../components/Button';

export const HomePage = () => {
  const { teams, pools, mainBracket, generateDemo } = useTournamentStore();
  const navigate = useNavigate();

  const handleDemo = () => {
    if (window.confirm("Générer une démo (19 joueurs, 90% des scores de poules) ? Cela effacera le tournoi actuel.")) {
      generateDemo();
      navigate('/poules');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel text-center py-12">
        <h1 className="text-4xl font-black mb-4">Bienvenue au Tournoi</h1>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Gérez votre tournoi de fléchettes individuel au Bowling Limoges Nord.
          Inscrivez les joueurs, générez les poules et suivez les matchs sur les cibles.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/inscriptions" className="btn btn-primary">Commencer les inscriptions</Link>
          {mainBracket && <Link to="/finale" className="btn">Voir la phase finale</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel text-center">
          <div className="text-3xl font-black text-bowling-neon mb-2">{teams.length}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wider">Joueurs inscrits</div>
        </div>
        <div className="panel text-center">
          <div className="text-3xl font-black text-bowling-pink mb-2">{pools.length}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wider">Poules générées</div>
        </div>
        <div className="panel text-center">
          <div className="text-3xl font-black text-white mb-2">{mainBracket ? 'Oui' : 'Non'}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wider">Phase finale prête</div>
        </div>
      </div>

      {/* 👇 BOUTON DÉMO BIEN VISIBLE 👇 */}
      <div className="mt-12 text-center">
        <div className="inline-block p-4 border border-dashed border-bowling-pink/50 rounded-xl bg-bowling-pink/5">
          <p className="text-sm text-bowling-pink mb-3">Outil de développement :</p>
          <Button variant="danger" onClick={handleDemo}>
            🎬 Lancer la Démo Vidéo (19 joueurs)
          </Button>
        </div>
      </div>
    </div>
  );
};