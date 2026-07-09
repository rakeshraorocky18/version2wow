import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import toast from "react-hot-toast";

export default function VendorLogin() {

  const navigate = useNavigate();

  const login = useVendorAuthStore((state) => state.login);
  const logout = useVendorAuthStore((state) => state.logout);
  const isLoading = useVendorAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);

      const user = JSON.parse(localStorage.getItem("vendorUser")!);

      if (user.role !== "vendor") {
        toast.error("Only vendors can login here.");
        logout();
        return;
      }

      toast.success("Login successful");

      navigate("/vendor");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
        "Login failed"
      );
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-md w-96">

        <h1 className="text-3xl font-bold text-center mb-6">
          Vendor Login
        </h1>

        <input
          className="input-field mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input-field mb-6"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

      </div>

    </div>
  );
}