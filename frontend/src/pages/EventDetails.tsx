import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
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
  status?: string;
  cancellationReason?: string;
  budget?: number;
  expectedGuests: number;
  confirmedGuests: number;
}

interface EventSummary {
  event: EventRecord;
  guestStats?: {
    totalGuests?: number;
    totalHeadcount?: number;
    accepted?: number;
    acceptedHeadcount?: number;
    pending?: number;
    declined?: number;
    maybe?: number;
  };
}

function titleCase(value?: string) {
  return String(value || 'Event').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) return { date: 'Date not set', time: 'Time not set' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: 'Date not set', time: 'Time not set' };
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

function DetailCard({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-[#F0DFE7] bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F5] text-[#B66A8A]">
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#9A5776]">{label}</p>
      <p className="mt-1 text-base font-bold text-[#4A2236]">{value || 'Not set'}</p>
    </div>
  );
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<EventSummary>({
    queryKey: ['event-summary', id],
    queryFn: async () => {
      const { data } = await api.get<EventSummary>(`/events/${id}/summary`);
      return data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#B66A8A]" size={32} />
      </div>
    );
  }

  if (isError || !data?.event) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-[#815A6D]">Event not found.</p>
        <Link to="/app/events" className="mt-4 inline-flex text-sm font-semibold text-[#B66A8A] hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  const event = data.event;
  const start = formatDateTime(event.dateTime);
  const end = formatDateTime(event.endTime);
  const pendingGuests = Math.max(0, (event.expectedGuests || 0) - (event.confirmedGuests || 0));

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
          <Link
            to={`/app/events/${event.id}/edit`}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#B66A8A] to-[#D89BB1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(182,106,138,0.32)]"
          >
            <Pencil size={16} /> Edit Event
          </Link>
        </div>

        <section className="mb-6 overflow-hidden rounded-[30px] border border-[#F0DFE7] bg-white shadow-[0_16px_50px_rgba(182,106,138,0.12)]">
          <div className="relative min-h-64 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-t from-[#3D1F30]/85 via-[#3D1F30]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <span className="mb-3 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#B66A8A]">
                {titleCase(event.type)}
              </span>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{event.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
                <MapPin size={16} /> {event.venue || event.venueAddress || 'Venue not set'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCard icon={CalendarDays} label="Date" value={start.date} />
          <DetailCard icon={Clock} label="Time" value={`${start.time}${event.endTime ? ` - ${end.time}` : ''}`} />
          <DetailCard icon={Users} label="Guests" value={`${event.confirmedGuests || 0}/${event.expectedGuests || 0} confirmed`} />
          <DetailCard icon={Wallet} label="Budget" value={event.budget ? `₹${event.budget.toLocaleString()}` : 'Not set'} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-[#F0DFE7] bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#4A2236]">Event Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#6B4A5A]">
              {event.description || 'No description added yet.'}
            </p>
          </div>

          <div className="space-y-4">
            {event.status === 'cancelled' && (
              <DetailCard icon={XCircle} label="Cancellation Reason" value={event.cancellationReason || 'No reason provided'} />
            )}
            <div className="rounded-3xl border border-[#F0DFE7] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9A5776]">Guest Summary</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-[#F5FFF8] p-3">
                  <p className="font-bold text-[#4A2236]">{data.guestStats?.acceptedHeadcount ?? event.confirmedGuests ?? 0}</p>
                  <p className="text-[10px] text-[#6A9B7C]">Confirmed</p>
                </div>
                <div className="rounded-2xl bg-[#FFF8EA] p-3">
                  <p className="font-bold text-[#4A2236]">{data.guestStats?.pending ?? pendingGuests}</p>
                  <p className="text-[10px] text-[#A98649]">Pending</p>
                </div>
                <div className="rounded-2xl bg-[#FFF0F0] p-3">
                  <p className="font-bold text-[#4A2236]">{data.guestStats?.declined ?? 0}</p>
                  <p className="text-[10px] text-[#B94D4D]">Declined</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
