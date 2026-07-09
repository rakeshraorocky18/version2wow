import { Routes, Route } from "react-router-dom";

import VendorLayout from "../components/VendorLayout";

import Dashboard from "../pages/Dashboard";
import Bookings from "../pages/Bookings";
import Chat from "../pages/Chat";
import Profile from "../pages/Profile";

// Authentication Pages
import VendorLogin from "../pages/Login";
import VendorRegister from "../pages/Register";
import CompleteProfile from "../pages/CompleteProfile";
import Business from "../pages/Business";
import Calendar from "../pages/Calendar";
import Reviews from "../pages/Reviews";

export default function VendorRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<VendorLogin />} />
      <Route path="/register" element={<VendorRegister />} />
      <Route path="complete-profile" element={<CompleteProfile />} />

      {/* Protected Layout (for now not protected) */}
      <Route path="/" element={<VendorLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="business" element={<Business />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="chat" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
    </Routes>
  );
}