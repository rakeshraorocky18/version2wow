import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

export default function AgentRegister() {
  const navigate = useNavigate();
  const register = useAgentAuthStore((s) => s.register);
  const isLoading = useAgentAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeCode: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Agent account created');
      navigate('/agent/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Registration failed';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8F3] to-[#F7EBEF] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg border border-wow-secondary/30"
      >
        <div className="text-center mb-6">
          <Heart className="w-8 h-8 text-wow-primary fill-wow-primary mx-auto mb-2" />
          <h1 className="font-display text-3xl">Register as Agent</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-wow-muted">First Name</label>
            <input
              className="input-field mt-1"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-wow-muted">Last Name</label>
            <input
              className="input-field mt-1"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-wow-muted">Email</label>
          <input
            className="input-field mt-1"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm text-wow-muted">Phone</label>
            <input
              className="input-field mt-1"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-wow-muted">Employee Code</label>
            <input
              className="input-field mt-1"
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 mb-6">
          <label className="text-sm text-wow-muted">Password</label>
          <input
            className="input-field mt-1"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? 'Creating...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-wow-muted mt-4">
          Already have an account?{' '}
          <Link to="/agent/login" className="text-wow-primary font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
