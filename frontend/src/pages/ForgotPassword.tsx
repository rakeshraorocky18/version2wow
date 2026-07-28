import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import api from '../lib/api';
import AuthBlossomShell from '../components/auth/AuthBlossomShell';
import WowLogo from '../components/brand/WowLogo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success(response.data.message);
      navigate('/verify-otp', { state: { email } });
    } catch {
      setIsSubmitted(true);
      toast.success('If your account exists, recovery instructions have been sent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthBlossomShell>
      <form onSubmit={handleSubmit} className="auth-card soft-fade-in">
        <div className="flex justify-center mb-6">
          <WowLogo to="/" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Forgot Password</h1>
        <p className="text-sm text-gray-500 text-center mt-1.5 mb-7">
          Enter your email to receive reset instructions.
        </p>

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

        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className="auth-btn-primary mt-6"
        >
          {isSubmitting ? 'Sending...' : isSubmitted ? 'Email Sent' : 'Send Recovery Email'}
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
