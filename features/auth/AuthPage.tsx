
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Mic, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessageType('success');
        setMessage('¡Cuenta creada! Revisa tu email para confirmar o inicia sesión directamente.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessageType('error');
      const msg = error.message || error.error_description || 'Error desconocido';
      if (msg.includes('Invalid login credentials')) {
        setMessage('Email o contraseña incorrectos.');
      } else if (msg.includes('User already registered')) {
        setMessage('Este email ya está registrado. Inicia sesión.');
      } else if (msg.includes('Password should be at least')) {
        setMessage('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl p-8 space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30">
              <Mic className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">DUALINK</h1>
          <p className="text-gray-400 mt-2">Your Audio-First Task Manager</p>
        </div>

        {/* Toggle Login / SignUp */}
        <div className="flex bg-gray-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${!isSignUp ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
          >
            <LogIn size={16} /> Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${isSignUp ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
          >
            <UserPlus size={16} /> Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-[0.98]"
            disabled={loading}
          >
            {loading
              ? (isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...')
              : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')
            }
          </button>
        </form>

        {/* Messages */}
        {message && (
          <div className={`text-center text-sm p-3 rounded-xl ${messageType === 'success'
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-red-400 bg-red-500/10 border border-red-500/20'
            }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
