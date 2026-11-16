import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readSavedSession() {
  const token = localStorage.getItem('heatwave_token');
  const rawUser = localStorage.getItem('heatwave_user');
  if (!token || !rawUser) return null;
  try { return { token, user: JSON.parse(rawUser) }; }
  catch { localStorage.removeItem('heatwave_token'); localStorage.removeItem('heatwave_user'); return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSavedSession);

  useEffect(() => {
    const expire = () => {
      localStorage.removeItem('heatwave_token');
      localStorage.removeItem('heatwave_user');
      setSession(null);
    };
    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.token),
    signIn: (result) => {
      localStorage.setItem('heatwave_token', result.accessToken);
      localStorage.setItem('heatwave_user', JSON.stringify(result.user));
      setSession({ token: result.accessToken, user: result.user });
    },
    signOut: () => {
      localStorage.removeItem('heatwave_token');
      localStorage.removeItem('heatwave_user');
      setSession(null);
    }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
