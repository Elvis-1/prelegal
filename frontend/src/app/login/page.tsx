'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? (tab === 'login' ? 'Invalid credentials.' : 'Sign up failed.'));
        return;
      }

      const { access_token } = await res.json();
      setToken(access_token);
      router.push('/');
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold" style={{ color: '#032147' }}>
          Prelegal
        </h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered legal document assistant</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Tab switcher */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#753991' }}
          >
            {loading
              ? 'Please wait…'
              : tab === 'login'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
