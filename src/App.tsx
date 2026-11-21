import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthGate } from './components/AuthGate';
import { HomePage } from './pages/HomePage';
import { InscriptionsPage } from './pages/InscriptionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PoolsPage } from './pages/PoolsPage';
import { FinalsPage } from './pages/FinalsPage';
import { StatsPage } from './pages/StatsPage';
import { ScoreEntryPage } from './pages/ScoreEntryPage';
import { ScoreEntryFinalPage } from './pages/ScoreEntryFinalPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 👇 ROUTES PUBLIQUES (Joueurs via QR Code) - Pas de mot de passe 👇 */}
        <Route path="/score/:poolId" element={<ScoreEntryPage />} />
        <Route path="/score/final/:matchId" element={<ScoreEntryFinalPage />} />

        {/* 👇 ROUTES ADMIN (Protégées par mot de passe) 👇 */}
        <Route path="/" element={
          <AuthGate>
            <Layout />
          </AuthGate>
        }>
          <Route index element={<HomePage />} />
          <Route path="inscriptions" element={<InscriptionsPage />} />
          <Route path="parametrage" element={<SettingsPage />} />
          <Route path="poules" element={<PoolsPage />} />
          <Route path="finale" element={<FinalsPage />} />
          <Route path="classement" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
