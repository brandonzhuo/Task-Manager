'use client';

import { useState } from 'react';

interface SignupResponse {
  token?: string;
  error?: string;
}

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error on submit

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: SignupResponse = await res.json();

      if (res.ok) {
        alert('Signup successful! Token: ' + data.token);
      } else {
        // In case of failure, display error message from the response
        setError(data.error || 'An unknown error occurred');
      }
    } catch (error) {
      // Network or server error
      setError('Signup failed: Unable to connect to the server.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-6 text-black">Sign Up</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="name" className="block text-black mb-2">Name</label>
            <input
              type="text"
              id="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full text-lg text-black placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-black mb-2">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full text-lg text-black placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-black mb-2">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full text-lg text-black placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-4 p-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition duration-200 w-full"
          >
            Sign Up
          </button>
        </form>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default SignupPage;
