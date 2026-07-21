import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginRoute from './routes/LoginRoute';
import SetupRoute from './routes/SetupRoute';
import PlayRoute from './routes/PlayRoute';
import RewardRoute from './routes/RewardRoute';
import SummaryRoute from './routes/SummaryRoute';
import DashboardRoute from './routes/DashboardRoute';
import SettingsRoute from './routes/SettingsRoute';
import s from './styles/shared.module.scss';

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
