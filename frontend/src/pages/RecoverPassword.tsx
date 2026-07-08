import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/auth/recover-password', { email });
      setIsSubmitted(true);
      toast.success('Recovery instructions sent to your email');
    } catch {
      // Keep response generic to avoid account enumeration.
      setIsSubmitted(true);
      toast.success('If your account exists, recovery instructions have been sent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-display font-bold text-primary-600">WOW</Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Recover Password</h1>
          <p className="mt-2 text-gray-600">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : isSubmitted ? 'Email Sent' : 'Send Recovery Email'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Back to{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
