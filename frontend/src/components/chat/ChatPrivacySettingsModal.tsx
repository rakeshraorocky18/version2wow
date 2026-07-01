import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface ChatPrivacySettingsModalProps {
  onClose: () => void;
}

export default function ChatPrivacySettingsModal({ onClose }: ChatPrivacySettingsModalProps) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['chat-privacy'],
    queryFn: async () => {
      const { data } = await api.get('/chat/privacy');
      return data;
    },
  });

  const [form, setForm] = useState<Record<string, boolean>>({});

  const effective = { ...settings, ...form };

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, boolean>) => {
      await api.put('/chat/privacy', payload);
    },
    onSuccess: () => {
      toast.success('Privacy settings saved');
      queryClient.invalidateQueries({ queryKey: ['chat-privacy'] });
      onClose();
    },
    onError: () => toast.error('Could not save settings'),
  });

  const toggle = (key: string) => {
    setForm((prev) => ({ ...prev, [key]: !(effective as Record<string, boolean>)[key] }));
  };

  const handleSave = () => {
    if (Object.keys(form).length) {
      updateMutation.mutate(form);
    } else {
      onClose();
    }
  };

  const items = [
    { key: 'allowMessages', label: 'Allow messages', desc: 'Let matched users send you messages' },
    { key: 'allowMediaSharing', label: 'Allow media sharing', desc: 'Photos, videos, and files in chat' },
    { key: 'allowVoiceCalls', label: 'Allow voice calls', desc: 'Incoming voice calls from matches' },
    { key: 'allowVideoCalls', label: 'Allow video calls', desc: 'Incoming video calls from matches' },
    { key: 'showOnlineStatus', label: 'Show online status', desc: 'Let matches see when you are online' },
    { key: 'readReceipts', label: 'Read receipts', desc: 'Show when you have read messages' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Shield size={18} className="text-primary-600" />
            Chat Privacy
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Chat is <strong>post-match only</strong>. Messaging unlocks after both parties accept an interest.
          Pre-match chat is not available yet.
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {items.map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!(effective as Record<string, boolean>)[key]}
                  onChange={() => toggle(key)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                />
              </label>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
