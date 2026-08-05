import { useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { useAuth } from '@/context/AuthContext';
import s from '@/app/styles/shared.module.scss';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (mode: 'login' | 'register') => {
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(name.trim(), password);
      else await register(name.trim(), password);
      onLogin();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di accesso');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = name.trim().length > 0 && password.length >= 4 && !busy;

  return (
    <div className={s.screen}>
      <Rabbit mood="happy" message="Chi gioca oggi?" />
      <h1>La Fattoria del Coniglio Cuoco</h1>

      <form
        className={`${s.card} ${s.setupForm}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) void run('login');
        }}
      >
        <label>
          Nome bambino
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. B001"
            autoComplete="username"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="almeno 4 caratteri"
            autoComplete="current-password"
          />
        </label>

        {error && <p className={s.saveErr}>⚠️ {error}</p>}

        <div className={s.rewardActions}>
          <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={!canSubmit}>
            {busy ? '…' : 'Accedi ▶'}
          </button>
          <button
            type="button"
            className={s.btn}
            onClick={() => void run('register')}
            disabled={!canSubmit}
          >
            Registra nuovo
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;
