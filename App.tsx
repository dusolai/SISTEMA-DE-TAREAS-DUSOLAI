import React, { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { useUIStore } from './store/uiStore'; // Importamos el nuevo store
import AuthPage from './features/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import { supabase } from './services/supabase';

import MobileQuickAdd from './features/kanban/components/MobileQuickAdd';

const App: React.FC = () => {
  const { session, setSession } = useAuthStore();
  const theme = useUIStore((state) => state.theme);
  const [currentHash, setCurrentHash] = React.useState(window.location.hash);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

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

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Determine what to render based on auth and hash
  let content = <AuthPage />;
  if (session) {
    if (currentHash === '#/add') {
      content = <MobileQuickAdd />;
    } else {
      content = <Dashboard key={session.user.id} />;
    }
  }

  return (
    <div className="min-h-screen font-sans">
      {content}
    </div>
  );
};

export default App;
