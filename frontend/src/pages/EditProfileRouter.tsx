import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isRepresentativeRole, isVendorRole } from '../lib/profileTypeOptions';
import EditProfile from './EditProfile';

export default function EditProfileRouter() {
  const user = useAuthStore((s) => s.user);

  if (isRepresentativeRole(user?.role)) {
    return <Navigate to="/app/profile/edit/representative" replace />;
  }
  if (isVendorRole(user?.role)) {
    return <Navigate to="/app/profile/edit/vendor" replace />;
  }

  return <EditProfile />;
}
