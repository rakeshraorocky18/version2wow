import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import toast from 'react-hot-toast';

export default function VendorRegister() {
  const navigate = useNavigate();

  const register = useVendorAuthStore((state) => state.register);
  const isLoading = useVendorAuthStore((state) => state.isLoading);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!businessName.trim()) {
      toast.error('Business Name is required');
      return;
    }

    if (!ownerName.trim()) {
      toast.error('Owner Name is required');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    try {
      await register(
        businessName,
        "photography", // or the selected category
        email,
        password,
        phone
      );

      toast.success('Vendor account created');

      navigate('/vendor/complete-profile');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          'Registration failed'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">

        <h1 className="text-3xl font-bold text-center mb-8">
          Vendor Registration
        </h1>

        <input
          className="input-field mb-4"
          placeholder="Business Name"
          value={businessName}
          onChange={(e) =>
            setBusinessName(e.target.value)
          }
        />

        <input
          className="input-field mb-4"
          placeholder="Owner Name"
          value={ownerName}
          onChange={(e) =>
            setOwnerName(e.target.value)
          }
        />

        <input
          className="input-field mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="input-field mb-4"
          placeholder="Phone"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <input
          className="input-field mb-6"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-center mt-6 text-sm">
          Already have an account?{' '}
          <Link
            to="/vendor/login"
            className="text-primary-600 font-medium"
          >
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}