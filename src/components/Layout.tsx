import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => (
  <div className="max-w-7xl mx-auto p-4 pb-8 min-h-screen flex flex-col relative">
    <Navbar />
    
    <main className="flex-1">
      <Outlet />
    </main>
    
    {/* 👇 LE PIED DE PAGE DU CLUB 👇 */}
    <footer className="mt-16 pt-6 border-t border-bowling-line flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Logo et nom du club */}
      <div className="flex items-center gap-3">
        <img 
          src="/logo-club.png" 
          alt="Logo du Club" 
          className="w-10 h-10 object-contain rounded-lg shadow-[0_0_10px_rgba(0,243,255,0.2)] bg-black/30 p-1"
          onError={(e) => {
            // Si l'image n'est pas trouvée, on affiche une cible à la place
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
          }}
        />
        <div>
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">En collaboration avec</div>
          <div className="text-sm font-black text-bowling-neon">The Wolfpack Darts Saint-Jouvent</div> {/* 👈 Change le nom ici */}
        </div>
      </div>

      {/* Signature */}
      <div className="text-xs text-slate-500 font-medium tracking-wide text-center md:text-right">
        Application Vibecodée avec passion<br className="md:hidden"/> par <span className="text-bowling-pink font-bold hover:text-white transition-colors cursor-default">Bergamote 🍋</span>
      </div>
      
    </footer>
  </div>
);