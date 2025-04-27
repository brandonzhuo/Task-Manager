import { useState } from 'react';

// Type the event parameter as React.FormEvent
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Type the event parameter explicitly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (res.ok) {
      alert('Login successful! Token: ' + data.token);
    } else {
      alert('Login failed: ' + data.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log In</button>
    </form>
  );
};

export default Login;
