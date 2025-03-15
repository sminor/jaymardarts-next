// src/components/Login.tsx
'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Email/Password login (keeping your existing functionality)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Invalid email or password');
        return;
      }

      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    }
  };

  // New: Facebook login
  const handleFacebookLogin = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'https://jaymardarts-next.netlify.app/tournament-tools',
        },
      });

      if (error) {
        setError('Facebook login failed: ' + error.message);
        console.error('Facebook login error:', error);
      }
    } catch (err) {
      console.error('Unexpected error during Facebook login:', err);
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <NavBar currentPage="tournament-tools" hideButtons={true} />
      <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
        <div className="p-6 bg-[var(--card-background)] rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold text-[var(--card-title)] mb-4 text-center">Login</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          
          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="mb-6">
            <div className="mb-4">
              <label className="block text-[var(--card-text)] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-[var(--card-text)] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="p-2 w-full bg-[var(--button-background)] text-[var(--button-text)] rounded-md hover:bg-[var(--button-hover)]"
            >
              Login
            </button>
          </form>

          {/* Facebook Login Button */}
          <button
            onClick={handleFacebookLogin}
            className="p-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign in with Facebook
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;