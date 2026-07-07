import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Camera, Save } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    religion: '',
    education: '',
    occupation: '',
    income: '',
    bio: '',
    city: '',
    state: '',
    country: 'India',
  });
  const [photoUrl, setPhotoUrl] = useState('');

  // Load existing profile on mount
  const { data: existingProfile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users/profile');
        return data;
      } catch {
        return null; // No profile yet
      }
    },
  });

  useEffect(() => {
    if (existingProfile) {
      setProfile({
        firstName: existingProfile.firstName || '',
        lastName: existingProfile.lastName || '',
        gender: existingProfile.gender || '',
        dateOfBirth: existingProfile.dateOfBirth || '',
        religion: existingProfile.religion || '',
        education: existingProfile.education || '',
        occupation: existingProfile.occupation || '',
        income: existingProfile.income || '',
        bio: existingProfile.bio || '',
        city: existingProfile.city || '',
        state: existingProfile.state || '',
        country: existingProfile.country || 'India',
      });
      setPhotoUrl(existingProfile.photos?.[0] || '');
    }
  }, [existingProfile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { firstName, lastName, dateOfBirth, religion, education, occupation, income, bio, city, state, country } = profile;
      const payload: any = {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        religion: religion || undefined,
        education: education || undefined,
        occupation: occupation || undefined,
        income: income || undefined,
        bio: bio || undefined,
        location: { city, state, country, pincode: '' },
      };
      // Only send gender if selected
      if (profile.gender) payload.gender = profile.gender;

      const { data } = await api.post('/users/profile', payload);
      return data;
    },
    onSuccess: () => toast.success('Profile saved!'),
    onError: () => toast.error('Failed to save profile'),
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be under 5MB');
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to read image file'));
        reader.readAsDataURL(file);
      });

      const { data } = await api.put('/users/profile', { photos: [dataUrl] });
      return data;
    },
    onSuccess: (data) => {
      const nextUrl = data?.photos?.[0] || '';
      setPhotoUrl(nextUrl);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Profile photo uploaded');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      toast.error(message);
    },
  });

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadPhoto.mutate(file);
    event.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">My Profile</h1>

      <div className="card">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-primary-500" />
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="text-sm text-primary-600 font-medium flex items-center gap-1 disabled:opacity-60"
            >
              <Camera size={14} /> {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 5MB</p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="input-field"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
            <input
              type="text"
              value={profile.religion}
              onChange={(e) => setProfile({ ...profile, religion: e.target.value })}
              className="input-field"
              placeholder="e.g. Hindu, Muslim, Christian"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <input
              type="text"
              value={profile.education}
              onChange={(e) => setProfile({ ...profile, education: e.target.value })}
              className="input-field"
              placeholder="e.g. B.Tech, MBA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
            <input
              type="text"
              value={profile.occupation}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              className="input-field"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
            <input
              type="text"
              value={profile.income}
              onChange={(e) => setProfile({ ...profile, income: e.target.value })}
              className="input-field"
              placeholder="e.g. 10-15 LPA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="input-field"
              placeholder="e.g. Mumbai"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              className="input-field"
              placeholder="e.g. Maharashtra"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="input-field min-h-[100px] resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <button
          onClick={() => saveProfile.mutate()}
          className="btn-primary mt-6 flex items-center gap-2"
        >
          <Save size={18} /> Save Profile
        </button>
      </div>
    </div>
  );
}
