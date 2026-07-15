import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Building2, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import AuthBlossomShell from '../../components/auth/AuthBlossomShell';
import WowLogo from '../../components/brand/WowLogo';

export default function AgentRegister() {
  const navigate = useNavigate();
  const register = useAgentAuthStore((s) => s.register);
  const isLoading = useAgentAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const parts = form.fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || undefined;

    try {
      await register({
        firstName,
        lastName,
        email: form.email,
        phone: form.phone || undefined,
        employeeCode: form.businessName || undefined,
        password: form.password,
      });
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
    <AuthBlossomShell>
      <form onSubmit={handleSubmit} className="auth-card soft-fade-in max-w-[440px]">
        <div className="flex justify-center mb-6">
          <WowLogo to="/agent/register" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Sign Up</h1>
        <p className="text-sm text-gray-500 text-center mt-1.5 mb-7">
          Create your agent account.
        </p>

        <div className="space-y-3.5">
          <div className="auth-input-wrap">
            <User className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Full Name"
              autoComplete="name"
            />
          </div>

          <div className="auth-input-wrap">
            <Building2 className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Business / Agency Name"
            />
          </div>

          <div className="auth-input-wrap">
            <Mail className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email Address"
              autoComplete="email"
            />
          </div>

          <div className="auth-input-wrap">
            <Phone className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone Number"
              autoComplete="tel"
            />
          </div>

          <div className="auth-input-wrap">
            <Lock className="auth-input-icon w-4 h-4" />
            <input
              className={`auth-input has-toggle`}
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-input-action"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="auth-input-wrap">
            <Lock className="auth-input-icon w-4 h-4" />
            <input
              className={`auth-input has-toggle`}
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm Password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-input-action"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="auth-btn-primary mt-6"
        >
          {isLoading ? 'Creating...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/agent/login" className="auth-link">
            Login
          </Link>
        </p>
      </form>
    </AuthBlossomShell>
  );
}
