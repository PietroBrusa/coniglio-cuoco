import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from '@/app/routes/ProtectedRoute';
import LoginRoute from '@/app/routes/LoginRoute';
import SetupRoute from '@/app/routes/SetupRoute';
import PlayRoute from '@/app/routes/PlayRoute';
import RewardRoute from '@/app/routes/RewardRoute';
import SummaryRoute from '@/app/routes/SummaryRoute';
import DashboardRoute from '@/app/routes/DashboardRoute';
import SettingsRoute from '@/app/routes/SettingsRoute';
import s from '@/app/styles/shared.module.scss';

/**
 * Mappa delle rotte dell'applicazione.
 *
 * Tutto ciò che riguarda un bambino sta dietro {@link app/routes/ProtectedRoute};
 * un indirizzo sconosciuto riporta al setup invece di mostrare una pagina vuota.
 */
const App = () => (
  <div className={s.wrapper}>
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/setup" element={<SetupRoute />} />
        <Route path="/play" element={<PlayRoute />} />
        <Route path="/reward" element={<RewardRoute />} />
        <Route path="/summary" element={<SummaryRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/setup" replace />} />
    </Routes>
  </div>
);

export default App;
