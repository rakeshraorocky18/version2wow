import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface EventRecord {
  id: string;
  name: string;
  type: string;
  dateTime: string;
  endTime?: string;
  venue?: string;
  venueAddress?: string;
  description?: string;
  budget?: number;
  expectedGuests?: number;
  status?: string;
}

const EVENT_TYPES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'wedding', label: 'Wedding Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  name: '',
  type: 'engagement',
  venue: '',
  date: '',
  startTime: '',
  endTime: '',
  expectedGuests: '',
  budget: '',
  description: '',
};

const inputClass =
  'w-full rounded-2xl border border-[#F0DFE7] bg-white/90 px-4 py-3 text-sm text-[#5D2B44] shadow-sm outline-none transition placeholder:text-[#C9A9B8] focus:border-[#B66A8A] focus:ring-4 focus:ring-[#F4D8E4]/70';

function splitDateTime(value?: string) {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [eventForm, setEventForm] = useState(emptyForm);

  const { data: event, isLoading, isError } = useQuery<EventRecord>({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data } = await api.get<EventRecord>(`/events/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!event) return;
    const start = splitDateTime(event.dateTime);
    const end = splitDateTime(event.endTime);
    setEventForm({
      name: event.name || '',
      type: event.type || 'engagement',
      venue: event.venue || event.venueAddress || '',
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      expectedGuests: event.expectedGuests != null ? String(event.expectedGuests) : '',
      budget: event.budget != null ? String(event.budget) : '',
      description: event.description || '',
    });
  }, [event]);

  const updateEvent = useMutation({
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
        budget: eventForm.budget ? Number(eventForm.budget) : undefined,
        description: eventForm.description.trim() || undefined,
      };

      const { data } = await api.put(`/events/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['event-summary', id] });
      navigate(`/app/events/${id}`);
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const apiMessage = axiosError.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || (error instanceof Error ? error.message : 'Failed to update event');
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#B66A8A]" size={32} />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-[#815A6D]">Event not found.</p>
        <Link to="/app/events" className="mt-4 inline-flex text-sm font-semibold text-[#B66A8A] hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="soft-fade-in -mx-4 rounded-3xl bg-gradient-to-br from-[#FFF7FA] via-white to-[#F8F3FF] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/app/events/${event.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#F0DFE7] bg-white px-4 py-2 text-sm font-semibold text-[#B66A8A] shadow-sm transition hover:bg-[#FFF5F8]"
          >
            <ArrowLeft size={16} /> Back to Details
          </Link>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-[#F0DFE7] bg-white shadow-[0_16px_50px_rgba(182,106,138,0.12)]">
          <div className="border-b border-[#F0DFE7] bg-gradient-to-r from-[#FCE8EF] via-[#F6E8FF] to-[#FFF5EF] px-6 py-6 sm:px-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#B66A8A]">
              <CalendarDays size={13} /> Edit Event
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-[#4A2236]">{event.name}</h1>
            <p className="mt-1 text-sm text-[#815A6D]">Update event details and save changes.</p>
          </div>

          <form
            className="p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              updateEvent.mutate();
            }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Name</span>
                <input
                  className={inputClass}
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

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Venue Name or Address</span>
                <input
                  className={inputClass}
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
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Expected Guests</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={eventForm.expectedGuests}
                  onChange={(e) => setEventForm({ ...eventForm, expectedGuests: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Budget</span>
                <div className="relative">
                  <CircleDollarSign size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B66A8A]" />
                  <input
                    type="number"
                    min="0"
                    className={`${inputClass} pl-11`}
                    value={eventForm.budget}
                    onChange={(e) => setEventForm({ ...eventForm, budget: e.target.value })}
                  />
                </div>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A5776]">Event Description</span>
                <textarea
                  className={`${inputClass} min-h-[120px] resize-y`}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link
                to={`/app/events/${event.id}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#D8B6C6] bg-white px-5 py-3 text-sm font-semibold text-[#7B4A62] transition hover:bg-[#FFF5F8]"
              >
                <X size={16} /> Cancel
              </Link>
              <button
                type="submit"
                disabled={updateEvent.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#B66A8A] to-[#D89BB1] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(182,106,138,0.32)] transition hover:shadow-[0_12px_28px_rgba(182,106,138,0.42)] disabled:opacity-60"
              >
                {updateEvent.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
