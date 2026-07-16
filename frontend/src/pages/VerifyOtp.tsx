import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import api from '../lib/api';
import AuthBlossomShell from '../components/auth/AuthBlossomShell';
import WowLogo from '../components/brand/WowLogo';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state || {}) as { email?: string };

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter OTP');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified successfully');
      navigate('/reset-password', { state: { email, otp } });
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid OTP',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <AuthBlossomShell>
        <div className="auth-card text-center">
          <div className="flex justify-center mb-6">
            <WowLogo to="/" />
          </div>
          <p className="mb-4 text-gray-600">Email not found.</p>
          <Link to="/forgot-password" className="auth-link text-sm">
            Go Back
          </Link>
        </div>
      </AuthBlossomShell>
    );
  }

  return (
    <AuthBlossomShell>
      <form onSubmit={handleVerifyOtp} className="auth-card soft-fade-in">
        <div className="flex justify-center mb-6">
          <WowLogo to="/" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Verify OTP</h1>
        <p className="text-sm text-gray-500 text-center mt-1.5">
          Enter the OTP sent to
        </p>
        <p className="text-sm font-semibold text-gray-800 text-center mb-7">{email}</p>

        <div className="auth-input-wrap">
          <Lock className="auth-input-icon w-4 h-4" />
          <input
            className="auth-input"
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            autoComplete="one-time-code"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-btn-primary mt-6">
          {loading ? 'Verifying...' : 'Verify OTP'}
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
}
