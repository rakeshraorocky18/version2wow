import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Hash,
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
} from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

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
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-medium
        ${type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
      )}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ─── modal shell ─────────────────────────────────────────── */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
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
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative"
        style={{ animation: 'fadeInScale 0.18s ease-out' }}
      >
        <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
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
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#E91E63]" />
      </div>
      <p className="w-36 text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 flex-1 truncate">{value || '—'}</p>
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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none select-none">
      <div className="relative flex flex-col items-center">
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="45" cy="45" r="44" fill="url(#gearGrad)" fillOpacity="0.12" />
          <circle cx="45" cy="45" r="30" fill="url(#gearGrad)" fillOpacity="0.15" />
          <g fill="none" stroke="url(#gearStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
        <div
          className="w-20 h-5 rounded-full mt-1"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(233,30,99,0.18) 0%, rgba(233,30,99,0.0) 80%)',
          }}
        />
      </div>
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-pink-300 opacity-60" />
      <div className="absolute bottom-6 left-0 w-1 h-1 rounded-full bg-pink-200 opacity-50" />
      <div className="absolute top-12 left-2 w-1 h-1 rounded-full bg-rose-300 opacity-40" />
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
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

  /* ── edit profile ── */
  const [editMode, setEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  const handleEditOpen = () => {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    // Validate phone number if entered
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length > 0) {
      let isValid = false;
      if (phoneDigits.length === 10) {
        isValid = /^[6-9]\d{9}$/.test(phoneDigits);
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) {
        isValid = /^[6-9]\d{9}$/.test(phoneDigits.slice(1));
      } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
        isValid = /^[6-9]\d{9}$/.test(phoneDigits.slice(2));
      }

      if (!isValid) {
        showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
    }

    setEditLoading(true);
    try {
      await updateProfile(form);
      setEditMode(false);
      showToast('Profile updated successfully!');
    } catch {
      showToast('Failed to update profile. Please try again.', 'error');
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
    if (pwdForm.newPwd.length < 6) {
      showToast('New password must be at least 6 characters.', 'error'); return;
    }
    setPwdLoading(true);
    try {
      await changePassword(pwdForm.current, pwdForm.newPwd);
      setPwdModal(false);
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      showToast('Password changed successfully! Please log in again if prompted.');
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
    <div className="space-y-5">
      {/* toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account settings and preferences</p>
      </div>

      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFF5F8 0%, #FFFFFF 50%, #FFF8FA 100%)' }}
      >
        <GearDecoration />
        <div className="flex items-center gap-5 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E91E63] to-[#F48FB1] text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-pink-200">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center shadow-sm hover:bg-pink-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-[#E91E63]" />
            </button>
          </div>
          {/* Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xl font-bold text-gray-800">{fullName}</p>
              <span className="bg-pink-100 text-[#E91E63] text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                {user?.role ?? 'Agent'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>{user?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{user?.phone || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Profile Information Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-800">Profile Information</h2>
              <div className="h-0.5 w-8 bg-[#E91E63] rounded-full mt-1" />
            </div>
            {!editMode ? (
              <button
                onClick={handleEditOpen}
                className="flex items-center gap-1.5 text-sm text-[#E91E63] hover:text-[#C2185B] font-semibold border border-pink-200 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          {!editMode ? (
            <div>
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow icon={Mail} label="Email Address" value={user?.email ?? ''} />
              <InfoRow icon={Phone} label="Phone Number" value={user?.phone ?? ''} />
              <InfoRow icon={Hash} label="Employee Code" value={user?.employeeCode ?? ''} />
              <InfoRow icon={Shield} label="Role" value={user?.role ?? 'agent'} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9+\-\s]/g, '').slice(0, 13) }))}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
                  placeholder="Phone number"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                <input
                  value={user?.email ?? ''}
                  disabled
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Code</label>
                <input
                  value={user?.employeeCode ?? ''}
                  disabled
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={editLoading}
                className="w-full bg-[#E91E63] hover:bg-[#C2185B] text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ── Quick Actions Card ── */}
        <div
          className="relative overflow-hidden rounded-2xl shadow-sm border border-pink-100"
          style={{ background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 40%, #AD1457 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-10 -left-6 w-44 h-44 rounded-full bg-white opacity-5" />
          <div className="absolute top-4 right-20 w-10 h-10 rounded-full bg-white opacity-5" />

          <div className="relative z-10 p-6 flex flex-col h-full">
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-base font-bold text-white">Quick Actions</h2>
              <div className="h-0.5 w-8 bg-white/40 rounded-full mt-1" />
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 mb-5 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
              <span className="text-xs font-medium text-white/80">Account Security</span>
            </div>

            {/* Main content */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-tight">Change Password</p>
                <p className="text-sm text-white/70 mt-1">
                  Keep your account secure by using a strong, unique password that you don't use elsewhere.
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-2 mb-6">
              {[
                'Use at least 8 characters',
                'Mix letters, numbers & symbols',
                'Avoid reusing old passwords',
              ].map((tip) => (
                <div key={tip} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <p className="text-xs text-white/70">{tip}</p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                setPwdForm({ current: '', newPwd: '', confirm: '' });
                setPwdModal(true);
              }}
              className="mt-auto flex items-center justify-center gap-2 w-full bg-white text-[#E91E63] py-3 rounded-xl text-sm font-bold hover:bg-pink-50 active:scale-95 transition-all duration-200 shadow-lg shadow-pink-900/20"
            >
              <Lock className="w-4 h-4" />
              Update Password
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Account Overview ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-800">Account Overview</h2>
          <div className="h-0.5 w-8 bg-[#E91E63] rounded-full mt-1" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Date Joined</p>
              <p className="text-sm font-semibold text-gray-700">{joinedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Last Login</p>
              <p className="text-sm font-semibold text-gray-700">{lastLogin}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Account Status</p>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end sm:justify-start">
            <button
              onClick={() => setDeactivateModal(true)}
              className="flex items-center gap-2 border border-pink-200 text-[#E91E63] px-4 py-2 rounded-full text-sm font-semibold hover:bg-pink-50 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Info Notice ── */}
      <div className="flex items-start gap-3 bg-pink-50 border border-pink-100 rounded-2xl px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-[#E91E63]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Agent accounts cannot access admin features.</p>
          <p className="text-xs text-gray-500 mt-0.5">Contact your administrator for password resets or role changes.</p>
        </div>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Change Password */}
      <Modal
        open={pwdModal}
        title="Change Password"
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
            placeholder="At least 6 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={pwdForm.confirm}
            onChange={(v) => setPwdForm((f) => ({ ...f, confirm: v }))}
            placeholder="Repeat new password"
          />
          {pwdForm.newPwd && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      pwdForm.newPwd.length >= i * 3
                        ? pwdForm.newPwd.length >= 12 ? 'bg-emerald-400' : pwdForm.newPwd.length >= 8 ? 'bg-amber-400' : 'bg-red-400'
                        : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {pwdForm.newPwd.length < 6 ? 'Too short' : pwdForm.newPwd.length < 8 ? 'Weak' : pwdForm.newPwd.length < 12 ? 'Good' : 'Strong'}
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setPwdModal(false); setPwdForm({ current: '', newPwd: '', confirm: '' }); }}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >Cancel</button>
            <button
              onClick={handleChangePassword}
              disabled={pwdLoading}
              className="flex-1 bg-[#E91E63] hover:bg-[#C2185B] text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            >
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirm */}
      <Modal open={deactivateModal} title="Deactivate Account" onClose={() => setDeactivateModal(false)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            Are you sure you want to deactivate your account? You will be logged out and your account will be inactive. Contact your administrator to reactivate.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setDeactivateModal(false)}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >Cancel</button>
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
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
            >Deactivate</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
