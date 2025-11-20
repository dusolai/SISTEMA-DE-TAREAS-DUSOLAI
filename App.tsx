import React, { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { useUIStore } from './store/uiStore'; // Importamos el nuevo store
import AuthPage from './features/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const { session, setSession } = useAuthStore();
  const theme = useUIStore((state) => state.theme); // Leemos el tema actual

  // EFECTO: Sincronizar tema con el DOM (HTML tag)
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // EFECTO: Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    // Quitamos las clases hardcodeadas de aquí porque ya están en el body (index.css)
    <div className="min-h-screen font-sans">
      {!session ? <AuthPage /> : <Dashboard key={session.user.id} />}
    </div>
  );
};

export default App;
