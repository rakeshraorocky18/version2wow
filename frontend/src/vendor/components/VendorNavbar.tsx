import { useNavigate } from "react-router-dom";
import { useVendorAuthStore } from "../../store/vendorAuthStore";

export default function VendorNavbar() {

  const navigate = useNavigate();
  const logout = useVendorAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/vendor/login");
  };

  return (
    <div className="h-16 bg-white shadow flex justify-between items-center px-6">
      <h2 className="text-xl font-semibold">
        Vendor Dashboard
      </h2>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}