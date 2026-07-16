import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';
import AuthBlossomShell from '../components/auth/AuthBlossomShell';
import WowLogo from '../components/brand/WowLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = (location.state || {}) as { email?: string; otp?: string };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to reset password',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email || !otp) {
    return (
      <AuthBlossomShell>
        <div className="auth-card text-center">
          <div className="flex justify-center mb-6">
            <WowLogo to="/" />
          </div>
          <p className="mb-4 text-gray-600">Invalid password reset session.</p>
          <Link to="/forgot-password" className="auth-link text-sm">
            Go to Forgot Password
          </Link>
        </div>
      </AuthBlossomShell>
    );
  }

  return (
    <AuthBlossomShell>
      <form onSubmit={handleResetPassword} className="auth-card soft-fade-in">
        <div className="flex justify-center mb-6">
          <WowLogo to="/" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Reset Password</h1>
        <p className="text-sm text-gray-500 text-center mt-1.5 mb-7">
          Choose a new password for your account.
        </p>

        <div className="space-y-3.5">
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon w-4 h-4" />
            <input
              className="auth-input has-toggle"
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

        <button type="submit" disabled={loading} className="auth-btn-primary mt-6">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Back to{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </form>
    </AuthBlossomShell>
  );
};

export default ResetPassword;
