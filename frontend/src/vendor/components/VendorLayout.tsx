import { Outlet } from "react-router-dom";
import VendorSidebar from "./VendorSidebar";
import VendorNavbar from "./VendorNavbar";

export default function VendorLayout() {
  return (
    <div className="flex h-screen">
      <VendorSidebar />

      <div className="flex-1 flex flex-col">
        <VendorNavbar />

        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}