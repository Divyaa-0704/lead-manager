import { useCallback, useEffect, useState } from 'react';
import { getMe, getToken, clearToken } from './api';
import AuthPage from './components/AuthPage';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  // On page load, if a token is saved, ask the backend who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  if (checking) return <p className="empty-state">Loading...</p>;
  if (!user) return <AuthPage onAuthenticated={setUser} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;