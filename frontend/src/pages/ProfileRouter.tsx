import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isRepresentativeRole, isVendorRole } from '../lib/profileTypeOptions';
import Profile from './Profile';

export default function ProfileRouter() {
  const user = useAuthStore((s) => s.user);

  if (isRepresentativeRole(user?.role)) {
    return <Navigate to="/app/profile/representative/me" replace />;
  }
  if (isVendorRole(user?.role)) {
    return <Navigate to="/app/profile/vendor/me" replace />;
  }

  return <Profile />;
}
