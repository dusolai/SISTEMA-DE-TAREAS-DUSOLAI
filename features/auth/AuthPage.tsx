
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Mic } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage('Check your email for the login link!');
    } catch (error: any) {
      setMessage(`Error: ${error.error_description || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="p-3 bg-indigo-600 rounded-full">
                    <Mic className="w-8 h-8 text-white"/>
                </div>
            </div>
          <h1 className="text-4xl font-bold text-white">DUSOLAI</h1>
          <p className="text-gray-400 mt-2">Your Audio-First Task Manager</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-all duration-300 disabled:bg-gray-600"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>
        </form>
        {message && <p className="text-center text-sm text-gray-400 mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default AuthPage;
