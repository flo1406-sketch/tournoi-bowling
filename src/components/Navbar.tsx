import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTournamentStore } from '../store/useTournamentStore';

export const Navbar = () => {
  const { 
    teams, resetTournament, 
    appTitle, appSubtitle, appLogo, 
    setAppTitle, setAppSubtitle, setAppLogo
  } = useTournamentStore();
  
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour le titre
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(appTitle || "Tournoi du Bowling");

  // États pour le sous-titre
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [tempSubtitle, setTempSubtitle] = useState(appSubtitle || "Limoges Nord · Fléchettes");

  // Synchronisation locale
  useEffect(() => { if (appTitle) setTempTitle(appTitle); }, [appTitle]);
  useEffect(() => { if (appSubtitle) setTempSubtitle(appSubtitle); }, [appSubtitle]);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) setAppTitle(tempTitle.trim());
    else setTempTitle(appTitle);
    setIsEditingTitle(false);
  };

  const handleSaveSubtitle = () => {
    if (tempSubtitle.trim()) setAppSubtitle(tempSubtitle.trim());
    else setTempSubtitle(appSubtitle);
    setIsEditingSubtitle(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAppLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    const text = prompt("⚠️ ATTENTION : Action irréversible.\n\nTapez EFFACER pour confirmer :");
    if (text === "EFFACER") resetTournament();
  };

  const links = [
    { path: '/', label: 'Accueil' },
    { path: '/inscriptions', label: 'Inscriptions' },
    { path: '/parametrage', label: 'Paramétrage' },
    { path: '/poules', label: 'Poules' },
    { path: '/finale', label: 'Phase Finale' },
    { path: '/classement', label: 'Classement' },
  ];

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-4 p-4 bg-bowling-panel border-b border-bowling-line mb-6">
      <div className="flex items-center gap-4">
        
        {/* LOGO */}
        <div 
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          title="Cliquez pour changer le logo"
        >
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="w-14 h-14 object-contain rounded-lg bg-black/20 p-1" />
          ) : (
            <div className="w-14 h-14 bg-red-600 rounded-lg flex flex-col items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]">
              <span className="text-3xl font-black leading-none">B</span>
              <span className="text-[0.35rem] font-bold text-center leading-tight mt-0.5">BOWLING<br/>LIMOGES NORD</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-white font-bold">✏️ Modif</span>
          </div>
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} className="hidden" />

        <div>
          {/* TITRE */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setTempTitle(appTitle); setIsEditingTitle(false); }
                }}
                className="text-xl font-bold bg-black/40 border border-bowling-neon rounded px-2 py-0.5 text-white outline-none w-64"
                autoFocus
              />
              <button onClick={handleSaveTitle} className="text-green-400 hover:text-green-300 text-lg font-bold" title="Valider">✓</button>
              <button onClick={() => { setTempTitle(appTitle); setIsEditingTitle(false); }} className="text-red-400 hover:text-red-300 text-lg font-bold" title="Annuler">✕</button>
            </div>
          ) : (
            <h1 
              className="text-xl font-bold bg-gradient-to-b from-white to-bowling-neon bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 group"
              onClick={() => setIsEditingTitle(true)}
              title="Cliquez pour modifier le titre"
            >
              {appTitle || "Tournoi du Bowling"}
              <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
            </h1>
          )}

          {/* SOUS-TITRE */}
          {isEditingSubtitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempSubtitle}
                onChange={(e) => setTempSubtitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveSubtitle();
                  if (e.key === 'Escape') { setTempSubtitle(appSubtitle); setIsEditingSubtitle(false); }
                }}
                className="text-xs font-bold bg-black/40 border border-bowling-neon rounded px-2 py-0.5 text-slate-300 outline-none w-64 uppercase tracking-widest"
                autoFocus
              />
              <button onClick={handleSaveSubtitle} className="text-green-400 hover:text-green-300 text-sm font-bold" title="Valider">✓</button>
              <button onClick={() => { setTempSubtitle(appSubtitle); setIsEditingSubtitle(false); }} className="text-red-400 hover:text-red-300 text-sm font-bold" title="Annuler">✕</button>
            </div>
          ) : (
            <p 
              className="text-xs text-slate-400 tracking-widest uppercase cursor-pointer hover:text-white transition-colors flex items-center gap-1 group w-fit"
              onClick={() => setIsEditingSubtitle(true)}
              title="Cliquez pour modifier le sous-titre"
            >
              {appSubtitle || "Limoges Nord · Fléchettes"}
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
            </p>
          )}
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
          {teams.length} joueur{teams.length > 1 ? 's' : ''}
        </span>
        <button onClick={handleReset} className="btn text-red-400 hover:border-red-400 hover:text-red-300">
          Réinitialiser
        </button>
      </div>
    </header>
  );
};