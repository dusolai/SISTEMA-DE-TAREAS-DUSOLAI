
import React, { useEffect } from 'react';
import useAuthStore from './store/authStore';
import AuthPage from './features/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const { session, setSession } = useAuthStore();

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
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {!session ? <AuthPage /> : <Dashboard key={session.user.id} />}
    </div>
  );
};

export default App;
