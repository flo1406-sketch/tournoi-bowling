import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => (
  <div className="max-w-7xl mx-auto p-4 pb-24">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);