'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'nookies'; // install: npm i nookies

interface LoginResponse {
  token?: string;
  error?: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: LoginResponse = await res.json();

      if (res.ok) {
        alert('Login successful!');
        const token = data.token;
        if (!token) {
          setError('Token is not a string!');
        } else {
          // Save into cookie
          setCookie(null, 'token', token, {
            path: '/',
            maxAge: 60 * 60, // 1 hour
          });

          router.push('/dashboard/kanban');
        }
      } else {
        setError(data.error || 'An unknown error occurred');
      }
    } catch (error) {
      setError('Login failed: Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-6 text-purple-700">Log In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 font-bold text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-bold text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white py-3 rounded-md hover:opacity-90 transition font-semibold shadow-md"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-center text-sm mt-4">{error}</p>
        )}

        {/* Link to Sign Up */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/signup')}
            className="text-purple-700 font-semibold hover:underline text-sm"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
