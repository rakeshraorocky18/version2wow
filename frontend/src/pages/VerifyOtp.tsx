import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const { email } = location.state || {};

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      toast.success("OTP verified successfully");

      // Go to Reset Password page
      navigate("/reset-password", {
      state: {
      email,
      otp,
     },
     });

    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div>
          <p>Email not found.</p>

          <Link
            to="/forgot-password"
            className="text-blue-600 underline"
          >
            Go Back
         </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            Verify OTP
          </h1>

          <p className="text-gray-500 mt-2">
            Enter the OTP sent to
          </p>

          <p className="font-semibold">
            {email}
          </p>
        </div>

        <form onSubmit={handleVerifyOtp}>

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

        </form>

      </div>

    </div>
  );
}