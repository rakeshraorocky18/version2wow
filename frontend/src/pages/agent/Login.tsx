import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

export default function AgentLogin() {
  const navigate = useNavigate();
  const login = useAgentAuthStore((s) => s.login);
  const logout = useAgentAuthStore((s) => s.logout);
  const isLoading = useAgentAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('agentUser') || '{}');
      if (user.role !== 'agent') {
        toast.error('Only agents can login here.');
        logout();
        return;
      }
      toast.success('Welcome back');
      navigate('/agent/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Login failed';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(183,110,121,0.85), rgba(44,38,48,0.75)), url(https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80)',
        }}
      />
      <div className="relative z-10 w-full max-w-md mx-4">
        <form
          onSubmit={handleLogin}
          className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 border border-white/40"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-wow-primary/10 mb-4">
              <Heart className="w-7 h-7 text-wow-primary fill-wow-primary" />
            </div>
            <h1 className="font-display text-3xl text-wow-text">WOW Agent</h1>
            <p className="text-wow-muted mt-2 text-sm">
              Sign in to manage your customers
            </p>
          </div>

          <label className="block text-sm text-wow-muted mb-1">Email</label>
          <input
            className="input-field mb-4"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@wow.com"
          />

          <label className="block text-sm text-wow-muted mb-1">Password</label>
          <input
            className="input-field mb-6"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-wow-muted mt-6">
            Need an agent account?{' '}
            <Link to="/agent/register" className="text-wow-primary font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
