import { useNavigate } from 'react-router';
import SettingsScreen from '@/screens/SettingsScreen/SettingsScreen';

/** Collega la schermata delle impostazioni alla navigazione. */
export default function SettingsRoute() {
  const navigate = useNavigate();
  return <SettingsScreen onBack={() => navigate('/setup')} />;
}
