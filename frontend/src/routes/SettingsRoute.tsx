import { useNavigate } from 'react-router';
import SettingsScreen from '../screens/SettingsScreen';

/** Route /settings: soglie delle stelle e suono, configurabili dal terapista. */
export default function SettingsRoute() {
  const navigate = useNavigate();
  return <SettingsScreen onBack={() => navigate('/setup')} />;
}
