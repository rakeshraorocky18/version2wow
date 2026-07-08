import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface ScheduleMeetingModalProps {
  participantId: string;
  participantName: string;
  onClose: () => void;
}

export default function ScheduleMeetingModal({
  participantId,
  participantName,
  onClose,
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState(`Meet with ${participantName}`);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      await api.post('/chat/meetings', {
        participantId,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Meeting scheduled!');
      queryClient.invalidateQueries({ queryKey: ['chat-meetings'] });
      onClose();
    },
    onError: () => toast.error('Could not schedule meeting'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) {
      toast.error('Please pick a date and time');
      return;
    }
    scheduleMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Calendar size={18} className="text-primary-600" />
            Schedule Meeting
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Date & time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input-field w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Duration (minutes)</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="input-field w-full text-sm"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input-field w-full text-sm"
              placeholder="Add agenda or location..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
