import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import VerifyOtp from './pages/VerifyOtp';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import MatchProfile from './pages/MatchProfile';
import Chat from './pages/Chat';
import Vendors from './pages/Vendors';
import Planner from './pages/Planner';
import ProfileRouter from './pages/ProfileRouter';
import EditProfileRouter from './pages/EditProfileRouter';
import ProfilePhotos from './pages/ProfilePhotos';
import ProfileDetails from './pages/ProfileDetails';
import EditRepresentativeProfile from './pages/representative/EditRepresentativeProfile';
import ManagedProfileEdit from './pages/representative/ManagedProfileEdit';
import ManagedProfileView from './pages/representative/ManagedProfileView';
import RepresentativeProfileView from './pages/representative/RepresentativeProfileView';
import EditVendorProfile from './pages/vendor/EditVendorProfile';
import VendorProfileView from './pages/vendor/VendorProfileView';
import Events from './pages/Events';
import EventCreate from './pages/EventCreate';
import EventDetails from './pages/EventDetails';
import EventEdit from './pages/EventEdit';
import Honeymoon from './pages/Honeymoon';
import Finance from './pages/Finance';
<<<<<<< HEAD
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

=======
>>>>>>> manoj
import VendorRoutes from './vendor/routes/VendorRoutes';
import BookingForm from './pages/BookingForm';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
     <Route path="/" element={<Landing />} />
     <Route path="/login" element={<Login />} />
     <Route path="/verify-otp" element={<VerifyOtp />} />
     <Route path="/forgot-password" element={<ForgotPassword />} />
     <Route path="/register" element={<Register />} />
     <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="matches" element={<Matches />} />
        <Route path="matches/:id" element={<MatchProfile />} />
        <Route path="chat" element={<Chat />} />
        <Route path="book/:vendorId" element={<BookingForm />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="planner" element={<Planner />} />
        <Route path="events/new" element={<EventCreate />} />
        <Route path="events/:id/edit" element={<EventEdit />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="events" element={<Events />} />
        <Route path="honeymoon" element={<Honeymoon />} />
        <Route path="finance" element={<Finance />} />
        <Route path="profile/edit/representative" element={<EditRepresentativeProfile />} />
        <Route path="profile/edit/managed" element={<ManagedProfileEdit />} />
        <Route path="profile/managed" element={<ManagedProfileView />} />
        <Route path="profile/edit/vendor" element={<EditVendorProfile />} />
        <Route path="profile/representative/:id" element={<RepresentativeProfileView />} />
        <Route path="profile/vendor/:id" element={<VendorProfileView />} />
        <Route path="profile/edit" element={<EditProfileRouter />} />
        <Route path="profile/details" element={<ProfileDetails />} />
        <Route path="profile/photos" element={<ProfilePhotos />} />
        <Route path="profile" element={<ProfileRouter />} />
       
      </Route>
      <Route path="/vendor/*" element={<VendorRoutes />} />
    </Routes>
  );
}

export default App;
