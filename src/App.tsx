import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { InscriptionsPage } from './pages/InscriptionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PoolsPage } from './pages/PoolsPage';
import { FinalsPage } from './pages/FinalsPage';
import { TargetsPage } from './pages/TargetsPage';
import { StatsPage } from './pages/StatsPage';
import { ScoreEntryPage } from './pages/ScoreEntryPage';
import { ScoreEntryFinalPage } from './pages/ScoreEntryFinalPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 👇 1. ROUTES PUBLIQUES (Sans Navbar, plein écran pour les téléphones) 👇 */}
        <Route path="/score/:poolId" element={<ScoreEntryPage />} />
        <Route path="/score/final/:matchId" element={<ScoreEntryFinalPage />} />

        {/* 👇 2. ROUTES ADMIN (Avec la Navbar et le Layout) 👇 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="inscriptions" element={<InscriptionsPage />} />
          <Route path="parametrage" element={<SettingsPage />} />
          <Route path="poules" element={<PoolsPage />} />
          <Route path="finale" element={<FinalsPage />} />
          <Route path="cibles" element={<TargetsPage />} />
          <Route path="classement" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}