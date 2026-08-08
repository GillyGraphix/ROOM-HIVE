import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Tunatafuta kama username na password zinalingana na zilizoko Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('Invalid username or password, please try again!');
      } else {
        onLogin(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-wider" style={{ color: '#18365c' }}>
            RoomHive <span className="text-xs px-2 py-0.5 rounded text-white font-bold" style={{ backgroundColor: '#1c78b9' }}>PRO</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Hotel Management System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none text-slate-800 bg-slate-50 text-sm"
              placeholder="e.g. Gazella"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none text-slate-800 bg-slate-50 text-sm"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-bold rounded-lg transition-all duration-300 shadow-md hover:opacity-90 text-sm"
            style={{ backgroundColor: '#1c78b9' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}