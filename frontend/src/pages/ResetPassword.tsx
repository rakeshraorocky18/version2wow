import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { email, otp } = location.state || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      toast.success("Password reset successfully");

      navigate("/login");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };
   if (!email || !otp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Invalid password reset session.</p>

          <button
            onClick={() => navigate("/forgot-password")}
            className="text-blue-600 underline"
          >
            Go to Forgot Password
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">

        <h2 className="text-2xl font-bold text-center mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleResetPassword} className="space-y-4">

            <div className="relative">
  <input
    type={showNewPassword ? "text" : "password"}
    placeholder="New Password"
    required
    className="w-full border rounded-lg p-3 pr-12"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
  />

  <button
    type="button"
    onClick={() => setShowNewPassword(!showNewPassword)}
    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
  >
    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>
</div>

          <div className="relative">
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm Password"
    required
    className="w-full border rounded-lg p-3 pr-12"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
  >
    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>
</div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

        </form>

      </div>
    </div>
  );
};

export default ResetPassword;