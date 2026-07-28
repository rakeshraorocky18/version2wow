import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/vendorAuthStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthBlossomShell from '../../components/auth/AuthBlossomShell';
import WowLogo from '../../components/brand/WowLogo';

export default function VendorLogin() {
  const navigate = useNavigate();
  const login = useVendorAuthStore((state) => state.login);
  const logout = useVendorAuthStore((state) => state.logout);
  const isLoading = useVendorAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('vendorUser')!);

      if (user.role !== 'vendor') {
        toast.error('Only vendors can login here.');
        logout();
        return;
      }

      toast.success('Login successful');
      navigate('/vendor');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Login failed',
      );
    }
  };

  return (
    <AuthBlossomShell>
      <form onSubmit={handleLogin} className="auth-card soft-fade-in">
        <div className="flex justify-center mb-6">
          <WowLogo to="/vendor/login" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Login</h1>
        <p className="text-sm text-gray-500 text-center mt-1.5 mb-7">
          Welcome back! Please login to continue.
        </p>

        <div className="space-y-4">
          <div className="auth-input-wrap">
            <Mail className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-wrap">
            <Lock className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input has-toggle"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
        </div>

        <button type="submit" disabled={isLoading} className="auth-btn-primary mt-6">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Looking for the main app?{' '}
          <Link to="/login" className="auth-link">
            Login here
          </Link>
        </p>
      </form>
    </AuthBlossomShell>
  );
}
