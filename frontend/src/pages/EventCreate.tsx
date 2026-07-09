import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Heart,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const EVENT_TYPES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'wedding', label: 'Wedding Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'other', label: 'Other' },
];

const EVENT_CATEGORIES = ['Main Event', 'Pre-Wedding', 'Post-Wedding', 'Family Ritual', 'Celebration'];
const EVENT_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const emptyForm = {
  name: '',
  type: 'engagement',
  category: 'Main Event',
  venue: '',
  date: '',
  startTime: '',
  endTime: '',
  expectedGuests: '',
  status: 'Upcoming',
  budget: '',
  description: '',
};

const inputClass =
  'w-full rounded-2xl border border-[#F0DFE7] bg-white/90 px-4 py-3 text-sm text-[#5D2B44] shadow-sm outline-none transition placeholder:text-[#C9A9B8] focus:border-[#B66A8A] focus:ring-4 focus:ring-[#F4D8E4]/70';

export default function EventCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [eventForm, setEventForm] = useState(emptyForm);

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!eventForm.name.trim() || !eventForm.date || !eventForm.startTime) {
        throw new Error('Event name, date, and start time are required');
      }

      const payload = {
        name: eventForm.name.trim(),
        type: eventForm.type,
        dateTime: `${eventForm.date}T${eventForm.startTime}`,
        endTime: eventForm.endTime ? `${eventForm.date}T${eventForm.endTime}` : undefined,
        venue: eventForm.venue.trim() || undefined,
        venueAddress: eventForm.venue.trim() || undefined,
        expectedGuests: eventForm.expectedGuests ? Number(eventForm.expectedGuests) : undefined,
        status: eventForm.status.toLowerCase(),
        budget: eventForm.budget ? Number(eventForm.budget) : undefined,
        description: eventForm.description.trim() || undefined,
      };

      const { data } = await api.post('/events', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Event saved successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/app/events');
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
    <div className="soft-fade-in -mx-4 rounded-3xl bg-gradient-to-br from-[#FFF7FA] via-white to-[#F8F3FF] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/app/events"
            className="inline-flex items-center gap-2 rounded-full border border-[#F0DFE7] bg-white px-4 py-2 text-sm font-semibold text-[#B66A8A] shadow-sm transition hover:bg-[#FFF5F8]"
          >
            <ArrowLeft size={16} /> Back to Events
          </Link>
        </div>

        <section className="grid overflow-hidden rounded-[30px] border border-[#F0DFE7] bg-white shadow-[0_16px_50px_rgba(182,106,138,0.12)] lg:grid-cols-[0.85fr_1.25fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FCE8EF] via-[#F6E8FF] to-[#FFF5EF] p-8">
            <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute -bottom-12 right-0 h-52 w-52 rounded-full bg-[#F2C9DA]/50 blur-3xl" />
            <div className="relative flex min-h-[420px] flex-col justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#B66A8A]">
                  <Heart size={13} fill="currentColor" /> Start planning
                </p>
                <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-[#4A2236]">
                  Create one beautiful wedding event.
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-[#815A6D]">
                  Fill the details here. After saving, the event will be added once and you will return to the Marriage Events dashboard.
                </p>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#B66A8A] shadow-sm">
                  <CalendarDays size={26} />
                </div>
                <p className="font-display text-lg font-bold text-[#4A2236]">Event Booking</p>
                <p className="mt-1 text-sm text-[#815A6D]">Use this page only for adding a new event.</p>
              </div>
            </div>
          </div>

          <form
            className="p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              createEvent.mutate();
            }}
          >
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-[#4A2236]">Create New Event</h2>
              <p className="mt-1 text-sm text-[#9A5776]">Add event details and save once.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Name</span>
                <input
                  className={inputClass}
                  placeholder="Wedding Reception"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Type</span>
                <select className={inputClass} value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}>
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Category</span>
                <select className={inputClass} value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Venue Name or Address</span>
                <input
                  className={inputClass}
                  placeholder="The Royal Orchid, Hyderabad"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Date</span>
                <input type="date" className={inputClass} value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Start Time</span>
                <input type="time" className={inputClass} value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">End Time</span>
                <input type="time" className={inputClass} value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Expected Number of Guests</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="250"
                  value={eventForm.expectedGuests}
                  onChange={(e) => setEventForm({ ...eventForm, expectedGuests: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Status</span>
                <select className={inputClass} value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}>
                  {EVENT_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Budget</span>
                <div className="relative">
                  <CircleDollarSign size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B66A8A]" />
                  <input
                    type="number"
                    min="0"
                    className={`${inputClass} pl-11`}
                    placeholder="500000"
                    value={eventForm.budget}
                    onChange={(e) => setEventForm({ ...eventForm, budget: e.target.value })}
                  />
                </div>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Description</span>
                <textarea
                  className={`${inputClass} min-h-[120px] resize-y`}
                  placeholder="Add notes about decor, rituals, food, or special instructions."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link
                to="/app/events"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#D8B6C6] bg-white px-5 py-3 text-sm font-semibold text-[#7B4A62] transition hover:bg-[#FFF5F8]"
              >
                <X size={16} /> Cancel
              </Link>
              <button
                type="submit"
                disabled={createEvent.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#B66A8A] to-[#D89BB1] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(182,106,138,0.32)] transition hover:shadow-[0_12px_28px_rgba(182,106,138,0.42)] disabled:opacity-60"
              >
                {createEvent.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Save Event
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
