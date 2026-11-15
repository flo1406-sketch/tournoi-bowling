import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => (
  <div className="max-w-7xl mx-auto p-4 pb-24 min-h-screen flex flex-col relative">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    
    {/* 👇 SIGNATURE DE L'APPLICATION 👇 */}
    <footer className="mt-12 text-center pb-6">
      <p className="text-xs text-slate-500 font-medium tracking-wide">
        Vibecodé avec passion par <span className="text-bowling-neon font-bold hover:text-white transition-colors cursor-default">Bergamote 🍋</span>
      </p>
    </footer>
  </div>
);