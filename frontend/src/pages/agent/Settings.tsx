import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  ShieldCheck,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  KeyRound,
  ArrowRight,
  Loader2,
  Sparkles,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import agentApi from '../../lib/agentApi';
import { resolveCustomerImageUrl } from '../../lib/agent/customerAvatar';
import { WORLD_COUNTRY_CODES, parsePhone, getIsoFromPhone, getExpectedLength, getCallingCode } from '../../lib/agent/addCustomerUtils';
import SearchableSelect from '../../components/agent/addCustomer/SearchableSelect';
import ProfilePhotoViewer from '../../components/agent/ProfilePhotoViewer';
import { AsYouType } from 'libphonenumber-js/max';

/* ─── tiny toast ──────────────────────────────────────────── */
function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3.5 rounded-2xl px-5 py-4 shadow-xl text-sm font-medium transition-all animate-bounce-short
        ${type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-600/20'}`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-rose-100 shrink-0" />
      )}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 p-0.5 rounded-full hover:bg-white/20 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── modal shell ─────────────────────────────────────────── */
function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-pink-100/50 w-full max-w-md p-6 sm:p-7 relative overflow-hidden"
        style={{ animation: 'modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <style>{`
          @keyframes modalScaleIn {
            from { opacity: 0; transform: scale(0.92) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500" />

        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── profile info row ─────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-3.5 px-3 rounded-xl hover:bg-pink-50/50 transition-colors border-b border-gray-100/60 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100/70 border border-pink-200/50 flex items-center justify-center shrink-0 shadow-xs">
        <Icon className="w-4 h-4 text-[#E91E63]" />
      </div>
      <p className="w-32 sm:w-36 text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">{label}</p>
      <p className="text-sm font-semibold text-gray-800 flex-1 truncate">{value || '—'}</p>
    </div>
  );
}

/* ─── password field ──────────────────────────────────────── */
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 pr-10 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-[#E91E63] transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─── decorative gear SVG ─────────────────────────────────── */
function GearDecoration() {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none select-none">
      <div className="relative flex flex-col items-center">
        <svg width="110" height="110" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="45" cy="45" r="44" fill="url(#gearGrad)" fillOpacity="0.15" />
          <circle cx="45" cy="45" r="30" fill="url(#gearGrad)" fillOpacity="0.2" />
          <g fill="none" stroke="url(#gearStroke)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M45 29a16 16 0 1 0 0 32 16 16 0 0 0 0-32z" />
            <path d="M45 33a12 12 0 1 0 0 24 12 12 0 0 0 0-24z" />
            <path d="M45 22v7M45 61v7M22 45h7M61 45h7M29.4 29.4l4.95 4.95M55.65 55.65l4.95 4.95M60.6 29.4l-4.95 4.95M34.35 55.65l-4.95 4.95" />
          </g>
          <defs>
            <linearGradient id="gearGrad" x1="0" y1="0" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E91E63" />
              <stop offset="1" stopColor="#F48FB1" />
            </linearGradient>
            <linearGradient id="gearStroke" x1="0" y1="0" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E91E63" />
              <stop offset="1" stopColor="#F06292" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
const countryOptions = WORLD_COUNTRY_CODES.map((cc) => ({
  value: cc.isoCode,
  label: `${cc.code} (${cc.country})`,
}));

export default function AgentSettings() {
  const user = useAgentAuthStore((s) => s.user);
  const updateProfile = useAgentAuthStore((s) => s.updateProfile);
  const changePassword = useAgentAuthStore((s) => s.changePassword);
  const deactivateAccount = useAgentAuthStore((s) => s.deactivateAccount);

  /* ── toast ── */
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5 MB.', 'error');
      return;
    }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await agentApi.post<{ url: string; profile: import('../../types/agent').AgentUser }>('/agent/me/photo', formData);
      if (data?.profile) {
        useAgentAuthStore.getState().setUser(data.profile);
      }
      setImgError(false);
      showToast('Profile picture updated successfully!');
    } catch (err: unknown) {
      const serverMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(serverMsg || 'Failed to upload profile picture. Please try again.', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const [imgError, setImgError] = useState(false);

  const handleRemovePhoto = async () => {
    setPhotoViewerOpen(false);
    setPhotoUploading(true);
    try {
      const { data } = await agentApi.delete<{ profile: import('../../types/agent').AgentUser }>('/agent/me/photo');
      if (data?.profile) {
        useAgentAuthStore.getState().setUser(data.profile);
      } else {
        const updated = await updateProfile({ profileImageUrl: null });
        useAgentAuthStore.getState().setUser(updated);
      }
      setImgError(false);
      showToast('Profile picture removed successfully!');
    } catch {
      try {
        const updated = await updateProfile({ profileImageUrl: null });
        useAgentAuthStore.getState().setUser(updated);
        setImgError(false);
        showToast('Profile picture removed successfully!');
      } catch {
        showToast('Failed to remove profile picture.', 'error');
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  /* ── edit profile ── */
  const [editMode, setEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; email?: string; phone?: string }>({});
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  const handleEditOpen = () => {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
    setErrors({});
    setEditMode(true);
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleSaveProfile = async () => {
    const newErrors: { firstName?: string; email?: string; phone?: string } = {};

    // Validate first name
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }

    // Validate email format
    const cleanEmail = form.email.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      newErrors.email = 'Invalid email address.';
    }

    // Validate mobile number: Must be exactly 10 digits
    const parsed = parsePhone(form.phone);
    const phoneDigits = parsed.number.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      newErrors.phone = 'Invalid mobile number. Must be 10 digits.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.email && newErrors.phone) {
        showToast('Invalid email address and mobile number.', 'error');
      } else if (newErrors.email) {
        showToast('Invalid email address.', 'error');
      } else if (newErrors.phone) {
        showToast('Invalid mobile number.', 'error');
      } else if (newErrors.firstName) {
        showToast('Please enter a valid first name.', 'error');
      }
      return;
    }

    setErrors({});
    setEditLoading(true);
    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: cleanEmail,
        phone: form.phone,
      });
      setEditMode(false);
      showToast('Profile updated successfully!');
    } catch (err: unknown) {
      const serverMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(serverMsg || 'Failed to update profile. Please try again.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── change password modal ── */
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) {
      showToast('Please fill all fields.', 'error'); return;
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      showToast('New passwords do not match.', 'error'); return;
    }
    if (pwdForm.newPwd.length < 8) {
      showToast('New password must be at least 8 characters.', 'error'); return;
    }
    const hasLetter = /[a-zA-Z]/.test(pwdForm.newPwd);
    const hasNumber = /[0-9]/.test(pwdForm.newPwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwdForm.newPwd);
    if (!hasLetter || !hasNumber || !hasSymbol) {
      showToast('Password must contain a mix of letters, numbers, and symbols.', 'error'); return;
    }
    if (pwdForm.newPwd === pwdForm.current) {
      showToast('New password cannot be the same as your current password.', 'error'); return;
    }
    setPwdLoading(true);
    try {
      await changePassword(pwdForm.current, pwdForm.newPwd);
      setPwdModal(false);
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      showToast('Password changed successfully!');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password. Check your current password.';
      showToast(msg, 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── deactivate confirm ── */
  const [deactivateModal, setDeactivateModal] = useState(false);

  /* ── date formatters ── */
  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const formatLastLogin = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch { return '—'; }
  };

  const joinedDate = formatJoinedDate(user?.createdAt);
  const lastLogin = formatLastLogin(user?.lastLoginAt);
  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || (user?.email?.[0] ?? 'A').toUpperCase();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Agent';

  return (
    <div className="space-y-7 pb-10">
      {/* toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {user?.profileImageUrl && !imgError && (
        <ProfilePhotoViewer
          open={photoViewerOpen}
          imageUrl={resolveCustomerImageUrl(user.profileImageUrl) || user.profileImageUrl}
          agentName={fullName}
          onClose={() => setPhotoViewerOpen(false)}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Settings
            <Sparkles className="w-5 h-5 text-[#E91E63] animate-pulse" />
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Manage your agent profile, security credentials, and account options
          </p>
        </div>
      </div>

      {/* ── Hero Profile Banner ── */}
      <div
        className="relative rounded-3xl border border-pink-100 shadow-lg shadow-pink-500/5 p-6 sm:p-8 overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 55%, #FFF5F8 100%)',
        }}
      >
        <GearDecoration />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with Ring & Controls */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 opacity-30 blur-sm group-hover:opacity-60 transition-opacity" />
            {user?.profileImageUrl && !imgError ? (
              <button
                type="button"
                onClick={() => setPhotoViewerOpen(true)}
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-pink-50 shadow-md ring-4 ring-pink-100/70 transition focus:outline-none focus:ring-pink-400 sm:h-28 sm:w-28"
                aria-label="View profile picture"
                title="View profile picture"
              >
                <img
                  src={resolveCustomerImageUrl(user.profileImageUrl)}
                  alt={`${fullName}'s profile picture`}
                  className="w-full h-full object-cover object-center"
                  onError={() => setImgError(true)}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 group-focus-within:bg-black/35 group-focus-within:opacity-100">
                  <Maximize2 className="h-6 w-6 drop-shadow" />
                </span>
              </button>
            ) : (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#E91E63] via-[#E91E63] to-[#C2185B] text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold shadow-md border-2 border-white ring-4 ring-pink-100/70">
                {initials}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Quick Action Overlay Buttons */}
            <div className="absolute bottom-0 right-0 flex items-center gap-1.5 z-10">
              <button
                onClick={() => !photoUploading && fileInputRef.current?.click()}
                disabled={photoUploading}
                className="w-8 h-8 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center shadow-md hover:bg-pink-50 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                title="Upload / Change profile photo"
              >
                {photoUploading ? (
                  <Loader2 className="w-4 h-4 text-[#E91E63] animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-[#E91E63]" />
                )}
              </button>
            </div>
          </div>

          {/* User Meta */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{fullName}</h2>
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                <Shield className="w-3 h-3" />
                {user?.role ?? 'Agent'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-w-lg">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-gray-600 bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-100">
                <Mail className="w-4 h-4 text-[#E91E63]" />
                <span className="truncate">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-gray-600 bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-100">
                <Phone className="w-4 h-4 text-[#E91E63]" />
                <span>{user?.phone || '—'}</span>
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3.5 flex-wrap">
              <button
                onClick={() => !photoUploading && fileInputRef.current?.click()}
                disabled={photoUploading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E91E63] bg-pink-50 hover:bg-pink-100 border border-pink-200/80 px-3.5 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
              >
                <Camera className="w-3.5 h-3.5" />
                {user?.profileImageUrl && !imgError ? 'Change Photo' : 'Upload Photo'}
              </button>
              {user?.profileImageUrl && !imgError && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3.5 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-Column Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Profile Information Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-[#E91E63]" />
                Profile Information
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Your personal profile details</p>
            </div>
            {!editMode ? (
              <button
                onClick={handleEditOpen}
                className="flex items-center gap-2 text-xs font-bold text-[#E91E63] hover:text-[#C2185B] bg-pink-50 hover:bg-pink-100/70 border border-pink-200/80 px-4 py-2 rounded-full transition-all active:scale-95 shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 rounded-full transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          {!editMode ? (
            <div className="space-y-1">
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow icon={Mail} label="Email Address" value={user?.email ?? ''} />
              <InfoRow icon={Phone} label="Phone Number" value={user?.phone ?? ''} />
              <InfoRow icon={Shield} label="Role" value={user?.role ?? 'agent'} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({ ...f, firstName: val }));
                      if (errors.firstName && val.trim()) {
                        setErrors((errs) => ({ ...errs, firstName: undefined }));
                      }
                    }}
                    className={`w-full rounded-xl border ${
                      errors.firstName ? 'border-rose-500 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-pink-500/20 focus:border-[#E91E63]'
                    } px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 transition-all`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-[#E91E63] transition-all"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({ ...f, email: val }));
                      if (errors.email && val.trim() && EMAIL_REGEX.test(val.trim())) {
                        setErrors((errs) => ({ ...errs, email: undefined }));
                      }
                    }}
                    className={`w-full rounded-xl border ${
                      errors.email ? 'border-rose-500 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-pink-500/20 focus:border-[#E91E63]'
                    } px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 transition-all`}
                    placeholder="agent@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Phone Number</label>
                <div className="flex gap-2 items-start">
                  <div className="w-[170px] shrink-0">
                    <SearchableSelect
                      value={getIsoFromPhone(form.phone)}
                      onChange={(val) => {
                        const parsed = parsePhone(form.phone);
                        const code = getCallingCode(val);
                        setForm((f) => ({
                          ...f,
                          phone: `${code} ${parsed.number}`.trim(),
                        }));
                      }}
                      options={countryOptions}
                      placeholder="Country"
                    />
                  </div>
                  <input
                    value={parsePhone(form.phone).number}
                    onChange={(e) => {
                      const parsed = parsePhone(form.phone);
                      const iso = getIsoFromPhone(form.phone);
                      let digits = e.target.value.replace(/\D/g, '');
                      if (digits.startsWith('0')) digits = digits.slice(1);
                      digits = digits.slice(0, 10);
                      const formatted = new AsYouType(iso as any).input(digits);
                      setForm((f) => ({
                        ...f,
                        phone: `${parsed.countryCode} ${formatted}`.trim(),
                      }));
                      if (errors.phone && digits.length === 10) {
                        setErrors((errs) => ({ ...errs, phone: undefined }));
                      }
                    }}
                    className={`flex-1 rounded-xl border ${
                      errors.phone ? 'border-rose-500 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-pink-500/20 focus:border-[#E91E63]'
                    } px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 transition-all`}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  className="w-full bg-[#E91E63] hover:bg-[#C2185B] text-white py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-60 shadow-md shadow-pink-500/20 flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Actions / Security Card ── */}
        <div
          className="relative overflow-hidden rounded-3xl shadow-lg border border-pink-500/20 flex flex-col justify-between p-6 sm:p-7"
          style={{
            background: 'linear-gradient(135deg, #E91E63 0%, #D81B60 45%, #880E4F 100%)',
          }}
        >
          {/* Ambient Background Circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Quick Security Actions</h2>
                <p className="text-xs text-white/70 mt-0.5">Manage your credentials & account protection</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-200" />
                <span className="text-xs font-semibold text-white">Protected</span>
              </div>
            </div>

            {/* Password Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Password & Authentication</h3>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Update your account password periodically to ensure your agent profile remains secure.
                  </p>
                </div>
              </div>

              {/* Password Tips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/15">
                {[
                  'Min. 8 characters',
                  'Letters, numbers & symbols',
                  'Avoid reused passwords',
                ].map((tip) => (
                  <div key={tip} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-200 shrink-0" />
                    <span className="text-[11px] font-medium text-white/80">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="relative z-10 pt-6">
            <button
              onClick={() => {
                setPwdForm({ current: '', newPwd: '', confirm: '' });
                setPwdModal(true);
              }}
              className="flex items-center justify-center gap-2.5 w-full bg-white text-[#E91E63] py-3.5 rounded-2xl text-sm font-bold hover:bg-pink-50 active:scale-95 transition-all duration-200 shadow-xl shadow-black/10"
            >
              <Lock className="w-4 h-4" />
              Update Password
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Account Overview ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Account Overview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Summary of your account status and activity timeline</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="w-11 h-11 rounded-xl bg-orange-100/70 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Joined</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{joinedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="w-11 h-11 rounded-xl bg-purple-100/70 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Login</p>
              <p className="text-xs font-bold text-gray-800 mt-0.5">{lastLogin}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="w-11 h-11 rounded-xl bg-emerald-100/70 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Status</p>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start lg:justify-end pt-2 sm:pt-0">
            <button
              onClick={() => setDeactivateModal(true)}
              className="flex items-center gap-2 border border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 px-5 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" /> Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Change Password Modal */}
      <Modal
        open={pwdModal}
        title="Change Password"
        subtitle="Enter your current password and choose a new secure password"
        onClose={() => { setPwdModal(false); setPwdForm({ current: '', newPwd: '', confirm: '' }); }}
      >
        <div className="space-y-4">
          <PasswordField
            label="Current Password"
            value={pwdForm.current}
            onChange={(v) => setPwdForm((f) => ({ ...f, current: v }))}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New Password"
            value={pwdForm.newPwd}
            onChange={(v) => setPwdForm((f) => ({ ...f, newPwd: v }))}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={pwdForm.confirm}
            onChange={(v) => setPwdForm((f) => ({ ...f, confirm: v }))}
            placeholder="Repeat new password"
          />

          {pwdForm.newPwd && (() => {
            const hasLetter = /[a-zA-Z]/.test(pwdForm.newPwd);
            const hasNumber = /[0-9]/.test(pwdForm.newPwd);
            const hasSymbol = /[^a-zA-Z0-9]/.test(pwdForm.newPwd);
            const len = pwdForm.newPwd.length;
            let score = 0;
            if (len >= 8) score += 1;
            if (len >= 12) score += 1;
            if (hasLetter && hasNumber) score += 1;
            if (hasSymbol) score += 1;
            
            return (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        score >= i
                          ? score === 4 ? 'bg-emerald-500' : score >= 2 ? 'bg-amber-400' : 'bg-rose-500'
                          : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                  <span>Password Strength</span>
                  <span className={score === 4 ? 'text-emerald-600' : score >= 2 ? 'text-amber-600' : 'text-rose-600'}>
                    {score === 0 ? 'Too short' : score === 1 ? 'Weak' : score === 2 ? 'Medium' : score === 3 ? 'Good' : 'Strong'}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => { setPwdModal(false); setPwdForm({ current: '', newPwd: '', confirm: '' }); }}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={pwdLoading}
              className="flex-1 bg-[#E91E63] hover:bg-[#C2185B] text-white py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-md shadow-pink-500/20 flex items-center justify-center gap-2"
            >
              {pwdLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirm Modal */}
      <Modal
        open={deactivateModal}
        title="Deactivate Account"
        subtitle="This action will log you out immediately"
        onClose={() => setDeactivateModal(false)}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <p className="text-gray-700 text-sm leading-relaxed font-medium">
            Are you sure you want to deactivate your account? Your session will be terminated and your account status marked inactive. You will need administrator assistance to reactivate.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setDeactivateModal(false)}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setDeactivateModal(false);
                try {
                  await deactivateAccount();
                  showToast('Account deactivated successfully!');
                } catch {
                  showToast('Failed to deactivate account.', 'error');
                }
              }}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
