import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthBlossomShell from '../components/auth/AuthBlossomShell';
import WowLogo from '../components/brand/WowLogo';

function GoogleGlyph() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      void remember;

      console.log("After login:");
      console.log("accessToken =", localStorage.getItem("accessToken"));
      console.log("refreshToken =", localStorage.getItem("refreshToken"));
      console.log("user =", localStorage.getItem("user"));

      toast.success("Welcome back!");
      navigate("/app");
    } catch {
      toast.error("Invalid email or password");
    } 
  };

  return (
    <AuthBlossomShell>
      <form onSubmit={handleSubmit} className="auth-card soft-fade-in">
        <div className="flex justify-center mb-6">
          <WowLogo to="/" />
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              autoComplete="email"
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

        <div className="flex items-center justify-between mt-4 mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-gray-300 text-[#E91E63] focus:ring-[#E91E63]"
            />
            Remember Me
          </label>
          <Link to="/forgot-password" className="text-sm auth-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" disabled={isLoading} className="auth-btn-primary">
          {isLoading ? 'Signing in...' : 'Login'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
          onClick={() => toast('Google sign-in coming soon', { icon: 'ℹ️' })}
        >
          <GoogleGlyph />
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-link">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthBlossomShell>
  );
}
