import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PartyPopper, Plus, Users, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Event {
  id: string;
  name: string;
  type: string;
  dateTime: string;
  venue?: string;
  expectedGuests: number;
  confirmedGuests: number;
}

export default function Events() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    type: 'engagement',
    date: '',
    venue: '',
    expectedGuests: '',
    description: '',
  });

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get<Event[]>('/events');
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!newEvent.name.trim() || !newEvent.date) {
        throw new Error('Event name and date are required');
      }

      const payload = {
        name: newEvent.name.trim(),
        type: newEvent.type,
        dateTime: newEvent.date,
        venue: newEvent.venue.trim() || undefined,
        expectedGuests: newEvent.expectedGuests ? Number(newEvent.expectedGuests) : undefined,
        description: newEvent.description.trim() || undefined,
      };

      const { data } = await api.post('/events', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Event saved successfully');
      setShowForm(false);
      setNewEvent({
        name: '',
        type: 'engagement',
        date: '',
        venue: '',
        expectedGuests: '',
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const apiMessage = axiosError.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || (error instanceof Error ? error.message : 'Failed to save event');
      toast.error(message);
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marriage Events</h1>
          <p className="text-gray-500 mt-1">Manage ceremonies, receptions & guest lists</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          New Event
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., Wedding Reception"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              >
                <option value="engagement">Engagement</option>
                <option value="mehendi">Mehendi</option>
                <option value="sangeet">Sangeet</option>
                <option value="haldi">Haldi</option>
                <option value="wedding">Wedding Ceremony</option>
                <option value="reception">Reception</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Venue name"
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Guests</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., 250"
                value={newEvent.expectedGuests}
                onChange={(e) => setNewEvent({ ...newEvent, expectedGuests: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Optional notes"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => createEvent.mutate()}
              disabled={createEvent.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
            >
              {createEvent.isPending ? 'Saving...' : 'Save Event'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <PartyPopper className="mx-auto text-primary-400" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No events yet</h3>
          <p className="mt-2 text-gray-500">Create your first wedding event to start managing guests and details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900">{event.name}</h3>
              <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{event.type}</span>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Clock size={14} /> {new Date(event.dateTime).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><MapPin size={14} /> {event.venue || 'Venue not set'}</div>
                <div className="flex items-center gap-2"><Users size={14} /> {event.confirmedGuests}/{event.expectedGuests} confirmed</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
