import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  Grid2X2,
  LayoutList,
  Loader2,
  MapPin,
  MoreHorizontal,
  PartyPopper,
  Pencil,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Event {
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

type EventFilter = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
type ViewMode = 'grid' | 'list';

const cardImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
];

function eventStatus(event: Event): EventFilter {
  const savedStatus = String(event.status || '').toLowerCase();
  if (savedStatus === 'cancelled' || event.cancellationReason) return 'cancelled';
  if (savedStatus === 'completed') return 'completed';
  if (savedStatus === 'ongoing') return 'ongoing';
  if (savedStatus === 'upcoming') return 'upcoming';
  const now = new Date();
  const start = new Date(event.dateTime);
  const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime())) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  if (now > end) return 'completed';
  return 'upcoming';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: 'Date not set', time: 'Time not set' };
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Events() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Event | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get<Event[]>('/events');
      return data;
    },
  });

  const cancelEvent = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/events/${id}`, {
        status: 'cancelled',
        cancellationReason: reason,
      });
    },
    onSuccess: () => {
      toast.success('Event cancelled');
      if (cancelTarget) {
        queryClient.setQueryData<Event[]>(['events'], (current = []) =>
          current.map((event) =>
            event.id === cancelTarget.id
              ? { ...event, status: 'cancelled', cancellationReason: cancelReason.trim() }
              : event,
          ),
        );
      }
      setActiveFilter('cancelled');
      setCancelTarget(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => toast.error('Could not cancel event'),
  });

  const stats = useMemo(() => {
    const statusCounts = events.reduce(
      (acc, event) => {
        acc[eventStatus(event)] += 1;
        return acc;
      },
      { upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 },
    );

    return {
      total: events.length,
      ...statusCounts,
      guests: events.reduce((sum, event) => sum + (event.confirmedGuests || 0), 0),
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const status = eventStatus(event);
      const matchesFilter = activeFilter === 'all' || status === activeFilter;
      const matchesSearch =
        !query ||
        [event.name, event.venue, event.venueAddress, event.type]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [events, activeFilter, search]);

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: PartyPopper, color: 'bg-[#FFF0F5] text-[#B66A8A]' },
    { label: 'Upcoming Events', value: stats.upcoming, icon: CalendarDays, color: 'bg-[#F3EEFF] text-[#8B74D6]' },
    { label: 'Ongoing Events', value: stats.ongoing, icon: Clock, color: 'bg-[#FFF6E5] text-[#C0872D]' },
    { label: 'Completed Events', value: stats.completed, icon: CheckCircle2, color: 'bg-[#EFFFF6] text-[#3D8B5F]' },
    { label: 'Cancelled Events', value: stats.cancelled, icon: XCircle, color: 'bg-[#FFF0F0] text-[#C75A5A]' },
    { label: 'Confirmed Guests', value: stats.guests, icon: UserCheck, color: 'bg-[#ECF7FF] text-[#4D86C8]' },
  ];

  const tabs: { id: EventFilter; label: string }[] = [
    { id: 'all', label: 'All Events' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="soft-fade-in -mx-4 rounded-3xl bg-gradient-to-br from-[#FFF7FA] via-white to-[#F8F3FF] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-[#F0DFE7] bg-white/80 px-6 py-7 shadow-[0_16px_50px_rgba(182,106,138,0.12)] backdrop-blur-xl sm:px-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#F9DEE7]/70 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-[#F6E8FF]/70 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#B66A8A]">
                <Sparkles size={13} /> WOW Event Studio
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#4A2236] sm:text-4xl">
                Marriage Events
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#815A6D]">
                Plan, organize & celebrate your special moments with elegant event tracking and guest-ready details.
              </p>
            </div>
            <Link
              to="/app/events/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#B66A8A] via-[#C8749A] to-[#D89BB1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(182,106,138,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(182,106,138,0.45)]"
            >
              <Plus size={18} /> Create New Event
            </Link>
          </div>
        </section>

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <article
              key={label}
              className="group rounded-3xl border border-[#F0DFE7] bg-white/85 p-5 shadow-[0_8px_24px_rgba(182,106,138,0.08)] backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(182,106,138,0.14)]"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                <Icon size={21} />
              </div>
              <p className="text-2xl font-bold text-[#4A2236]">{value}</p>
              <p className="mt-1 text-xs font-medium text-[#9A5776]">{label}</p>
            </article>
          ))}
        </section>

        <section className="mb-6 rounded-3xl border border-[#F0DFE7] bg-white/80 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`relative shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    activeFilter === tab.id
                      ? 'bg-[#FFF0F5] text-[#B66A8A]'
                      : 'text-[#815A6D] hover:bg-[#FFFBFC] hover:text-[#5D2B44]'
                  }`}
                >
                  {tab.label}
                  {activeFilter === tab.id && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-[#B66A8A]" />
                  )}
                </button>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:w-80">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B66A8A]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by event, venue, or location"
                  className="w-full rounded-2xl border border-[#F0DFE7] bg-[#FFFBFC] py-3 pl-11 pr-4 text-sm text-[#5D2B44] outline-none transition placeholder:text-[#C9A9B8] focus:border-[#B66A8A] focus:bg-white focus:ring-4 focus:ring-[#F4D8E4]/60"
                />
              </div>
              <div className="flex rounded-2xl bg-[#FFFBFC] p-1 ring-1 ring-[#F0DFE7]">
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-xl p-2 transition ${viewMode === 'grid' ? 'bg-white text-[#B66A8A] shadow-sm' : 'text-[#9A5776]'}`}
                >
                  <Grid2X2 size={18} />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                  className={`rounded-xl p-2 transition ${viewMode === 'list' ? 'bg-white text-[#B66A8A] shadow-sm' : 'text-[#9A5776]'}`}
                >
                  <LayoutList size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-[#F0DFE7] bg-white/80 p-12 text-center text-[#9A5776] shadow-sm">
            <Loader2 className="mx-auto mb-3 animate-spin text-[#B66A8A]" size={32} />
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-[#F0DFE7] bg-white/80 p-12 text-center shadow-sm">
            <PartyPopper className="mx-auto text-[#B66A8A]" size={48} />
            <h3 className="mt-4 font-display text-xl font-semibold text-[#4A2236]">No events found</h3>
            <p className="mt-2 text-sm text-[#9A5776]">Create a wedding event or adjust your filters to see more results.</p>
          </div>
        ) : (
          <section className={viewMode === 'grid' ? 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4' : 'space-y-4'}>
            {filteredEvents.map((event, index) => {
              const status = eventStatus(event);
              const date = formatDateTime(event.dateTime);
              const pendingGuests = Math.max(0, (event.expectedGuests || 0) - (event.confirmedGuests || 0));
              const statusStyles: Record<EventFilter, string> = {
                all: 'bg-[#FFF0F5] text-[#B66A8A]',
                upcoming: 'bg-[#FFF6E5] text-[#A86F12]',
                ongoing: 'bg-[#EFFFF6] text-[#2F7A51]',
                completed: 'bg-[#EEF5FF] text-[#4D6EC8]',
                cancelled: 'bg-[#FFF0F0] text-[#B94D4D]',
              };

              return (
                <article
                  key={event.id}
                  className={`group overflow-hidden rounded-3xl border border-[#F0DFE7] bg-white shadow-[0_8px_28px_rgba(182,106,138,0.09)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(182,106,138,0.16)] ${
                    viewMode === 'list' ? 'sm:grid sm:grid-cols-[260px_1fr]' : ''
                  }`}
                >
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'h-56 sm:h-full' : 'h-48'}`}>
                    <img
                      src={cardImages[index % cardImages.length]}
                      alt={event.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3D1F30]/50 via-transparent to-transparent" />
                    <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur ${statusStyles[status]}`}>
                      {titleCase(status)}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#4A2236]">{event.name}</h3>
                        <span className="mt-2 inline-flex rounded-full bg-[#FFF0F5] px-2.5 py-1 text-[11px] font-semibold text-[#B66A8A]">
                          {titleCase(event.type || 'Main Event')}
                        </span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                          className="rounded-xl p-2 text-[#9A5776] transition hover:bg-[#FFF5F8] hover:text-[#B66A8A]"
                          aria-label="Event actions"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === event.id && (
                          <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-[#F0DFE7] bg-white py-2 text-sm shadow-xl">
                            <Link
                              to={`/app/events/${event.id}/edit`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#5D2B44] hover:bg-[#FFF5F8]"
                            >
                              <Pencil size={14} /> Edit
                            </Link>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setCancelTarget(event);
                                setCancelReason('');
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#A86F12] hover:bg-[#FFF8EA]"
                            >
                              <Ban size={14} /> Cancel Event
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-[#6B4A5A]">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-[#B66A8A]" /> {date.date} at {date.time}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#B66A8A]" /> {event.venue || event.venueAddress || 'Venue not set'}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-[#FFFBFC] p-3 text-center ring-1 ring-[#F0DFE7]">
                        <Users size={15} className="mx-auto text-[#B66A8A]" />
                        <p className="mt-1 text-sm font-bold text-[#4A2236]">{event.expectedGuests || 0}</p>
                        <p className="text-[10px] text-[#9A5776]">Total</p>
                      </div>
                      <div className="rounded-2xl bg-[#F5FFF8] p-3 text-center ring-1 ring-[#DDF2E5]">
                        <UserCheck size={15} className="mx-auto text-[#3D8B5F]" />
                        <p className="mt-1 text-sm font-bold text-[#4A2236]">{event.confirmedGuests || 0}</p>
                        <p className="text-[10px] text-[#6A9B7C]">Confirmed</p>
                      </div>
                      <div className="rounded-2xl bg-[#FFF8EA] p-3 text-center ring-1 ring-[#F4E3BC]">
                        <Clock size={15} className="mx-auto text-[#C0872D]" />
                        <p className="mt-1 text-sm font-bold text-[#4A2236]">{pendingGuests}</p>
                        <p className="text-[10px] text-[#A98649]">Pending</p>
                      </div>
                    </div>

                    <Link
                      to={`/app/events/${event.id}`}
                      className="mt-5 block w-full rounded-2xl bg-gradient-to-r from-[#B66A8A] to-[#D89BB1] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_18px_rgba(182,106,138,0.28)] transition hover:shadow-[0_10px_24px_rgba(182,106,138,0.38)]"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {cancelTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1624]/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-[#F0DFE7] bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex rounded-full bg-[#FFF8EA] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#A86F12]">
                    Cancel Event
                  </p>
                  <h2 className="mt-3 font-display text-xl font-bold text-[#4A2236]">
                    Why are you cancelling “{cancelTarget.name}”?
                  </h2>
                  <p className="mt-1 text-sm text-[#815A6D]">
                    This reason will be saved with the event for future reference.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="rounded-xl p-2 text-[#9A5776] hover:bg-[#FFF5F8]"
                  aria-label="Close cancel dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[130px] w-full resize-y rounded-2xl border border-[#F0DFE7] bg-[#FFFBFC] px-4 py-3 text-sm text-[#5D2B44] outline-none transition placeholder:text-[#C9A9B8] focus:border-[#B66A8A] focus:bg-white focus:ring-4 focus:ring-[#F4D8E4]/70"
                placeholder="Example: Venue unavailable, date changed, family decision, budget changes..."
              />

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="rounded-2xl border border-[#D8B6C6] bg-white px-5 py-3 text-sm font-semibold text-[#7B4A62] transition hover:bg-[#FFF5F8]"
                >
                  Keep Event
                </button>
                <button
                  type="button"
                  disabled={!cancelReason.trim() || cancelEvent.isPending}
                  onClick={() => cancelEvent.mutate({ id: cancelTarget.id, reason: cancelReason.trim() })}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#A86F12] to-[#D5A64B] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(168,111,18,0.25)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelEvent.isPending ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
