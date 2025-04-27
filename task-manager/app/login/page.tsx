"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';

interface LoginResponse {
  token?: string;
  error?: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();  // Hook for navigation in Next.js

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error on submit
    setIsLoading(true); // Set loading state to true

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
        // Assuming the response contains a token
        alert('Login successful! Token: ' + data.token);
        // Redirect to another route after successful login
        router.push('/dashboard'); // Redirect to the dashboard or any route
      } else {
        // Handle error response from server
        setError(data.error || 'An unknown error occurred');
      }
    } catch (error) {
      // Network or server error
      setError('Login failed: Unable to connect to the server.');
    } finally {
      setIsLoading(false); // Reset loading state after request is finished
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
    </div>
  );
};

export default LoginPage;
