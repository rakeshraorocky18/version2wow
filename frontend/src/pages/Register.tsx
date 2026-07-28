import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Phone, User } from 'lucide-react';
import AuthBlossomShell from '../components/auth/AuthBlossomShell';
import WowLogo from '../components/brand/WowLogo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('bride');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await register(email, password, role, phone || undefined);
      toast.success('Account created successfully!');
      navigate('/app');
    } catch {
      toast.error('Registration failed. Email may already be in use.');
    }
  };

  return (
    <AuthBlossomShell>
      <form onSubmit={handleSubmit} className="auth-card soft-fade-in max-w-[440px]">
        <div className="flex justify-center mb-6">
          <WowLogo to="/" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Sign Up</h1>
        <p className="text-sm text-gray-500 text-center mt-1.5 mb-7">
          Start your wedding journey today.
        </p>

        <div className="space-y-3.5">
          <div className="auth-input-wrap">
            <User className="auth-input-icon w-4 h-4" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-input appearance-none"
            >
              <option value="bride">I am a Bride</option>
              <option value="groom">I am a Groom</option>
              <option value="representative">Family Member / Friend</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          <div className="auth-input-wrap">
            <Mail className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-wrap">
            <Phone className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              autoComplete="tel"
            />
          </div>

          <div className="auth-input-wrap">
            <Lock className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input has-toggle"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
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
              className="auth-input has-toggle"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
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

        <button type="submit" disabled={isLoading} className="auth-btn-primary mt-6">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </form>
    </AuthBlossomShell>
  );
}
