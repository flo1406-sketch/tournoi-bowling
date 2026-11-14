import { Link, useLocation } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';

export const Navbar = () => {
  const { teams, resetTournament } = useTournamentStore();
  const location = useLocation();

  const links = [
    { path: '/', label: 'Accueil' },
    { path: '/inscriptions', label: 'Inscriptions' },
    { path: '/parametrage', label: 'Paramétrage' },
    { path: '/poules', label: 'Poules' },
    { path: '/finale', label: 'Phase Finale' },
    { path: '/cibles', label: 'Cibles' },
    { path: '/classement', label: 'Classement' },
  ];

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-4 p-4 bg-bowling-panel border-b border-bowling-line mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-red-600 rounded-lg flex flex-col items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]">
          <span className="text-3xl font-black leading-none">B</span>
          <span className="text-[0.35rem] font-bold text-center leading-tight mt-0.5">BOWLING<br/>LIMOGES NORD</span>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-b from-white to-bowling-neon bg-clip-text text-transparent">
            Tournoi du Bowling
          </h1>
          <p className="text-xs text-slate-400 tracking-widest uppercase">Limoges Nord · Fléchettes</p>
        </div>
      </div>

      <nav className="flex gap-2 flex-wrap">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
              location.pathname === link.path
                ? 'bg-bowling-neon text-black border-bowling-neon shadow-[0_0_15px_rgba(0,243,255,0.5)]'
                : 'bg-bowling-dark text-slate-400 border-bowling-line hover:text-white hover:border-bowling-neon'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-sm font-bold px-3 py-1 rounded-full bg-bowling-neon/10 text-bowling-neon border border-bowling-neon/30">
          {teams.length} équipe{teams.length > 1 ? 's' : ''}
        </span>
        <button onClick={() => { if(confirm('Tout effacer ?')) resetTournament() }} className="btn text-red-400 hover:border-red-400 hover:text-red-300">
          Réinitialiser
        </button>
      </div>
    </header>
  );
};