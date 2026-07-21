import { useNavigate } from 'react-router';
import SettingsScreen from '../screens/SettingsScreen';

export default function SettingsRoute() {
  const navigate = useNavigate();
  return <SettingsScreen onBack={() => navigate('/setup')} />;
}
