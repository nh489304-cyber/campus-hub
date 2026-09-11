import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Filter,
  Heart,
  House,
  MapPin,
  Menu,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetClubQueryKey,
  getGetEventQueryKey,
  useGetClub,
  useGetDashboard,
  useGetEvent,
  useListClubs,
  useListEvents,
} from '@workspace/api-client-react';
import type { Club, Event } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const savedKey = 'campus-hub-saved';

type SavedItem = { type: 'club' | 'event'; id: number };

function readSaved(): SavedItem[] {
  try {
    return JSON.parse(localStorage.getItem(savedKey) || '[]') as SavedItem[];
  } catch {
    return [];
  }
}

function useSaved() {
  const [saved, setSaved] = useState<SavedItem[]>(readSaved);
  const toggle = (type: SavedItem['type'], id: number) => {
    const exists = saved.some((item) => item.type === type && item.id === id);
    const next = exists ? saved.filter((item) => !(item.type === type && item.id === id)) : [...saved, { type, id }];
    setSaved(next);
    localStorage.setItem(savedKey, JSON.stringify(next));
  };
  const has = (type: SavedItem['type'], id: number) => saved.some((item) => item.type === type && item.id === id);
  return { saved, toggle, has };
}

function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(parsed);
}

function formatDay(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return { day: '--', month: '---' };
  return {
    day: new Intl.DateTimeFormat('en', { day: '2-digit' }).format(parsed),
    month: new Intl.DateTimeFormat('en', { month: 'short' }).format(parsed).toUpperCase(),
  };
}

function money(value: number) {
  return value === 0 ? 'Free' : `₹${value.toLocaleString('en-IN')}`;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: House },
    { href: '/clubs', label: 'Clubs', icon: Users },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/saved', label: 'Saved', icon: Bookmark },
  ];
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[258px] border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)} data-testid="link-brand">
            <span className="grid size-10 place-items-center rounded-[13px] bg-sidebar-primary font-display text-lg font-bold text-sidebar-primary-foreground">C</span>
            <span>
              <span className="block font-display text-[19px] font-bold leading-none tracking-tight">Campus Hub</span>
              <span className="mt-1 block font-mono-app text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/55">Find your people</span>
            </span>
          </Link>
          <button className="rounded-md p-1 text-sidebar-foreground/65 hover:bg-sidebar-accent lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation"><X size={18} /></button>
        </div>

        <div className="mt-12">
          <p className="mb-3 px-3 font-mono-app text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40">Explore campus</p>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid={`link-nav-${label.toLowerCase()}`}>
                  <Icon size={18} strokeWidth={active ? 2.4 : 1.8} className={active ? 'text-sidebar-primary' : ''} />
                  <span>{label}</span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/65 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Live on campus</span>
          </div>
          <p className="text-xs leading-relaxed text-sidebar-foreground/65">One place for the clubs, people, and plans worth showing up for.</p>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-foreground/35 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-mobile-overlay" />}
      <main className="min-h-[100dvh] lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-accent" />
            <span>Good afternoon, student</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 font-mono-app text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:block">2024—25</span>
            <span className="grid size-9 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground" data-testid="avatar-student">ST</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-3 font-mono-app text-[10px] font-medium uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold tracking-[-0.05em] text-primary sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function SaveButton({ type, id, saved, toggle }: { type: SavedItem['type']; id: number; saved: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} className={`grid size-9 place-items-center rounded-full border transition-all ${saved ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card text-muted-foreground hover:border-accent hover:text-accent'}`} aria-label={saved ? 'Remove from saved' : 'Save for later'} data-testid={`button-save-${type}-${id}`}>
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

function LoadingGrid({ label = 'Loading campus activity' }: { label?: string }) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-muted" /><div className="h-48 animate-pulse rounded-2xl bg-muted" /><p className="col-span-full font-mono-app text-xs text-muted-foreground">{label}...</p></div>;
}

function ErrorState({ onRetry, title = 'The campus board is taking a breather.' }: { onRetry: () => void; title?: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-accent"><Compass size={21} /></div><h2 className="font-display text-xl font-bold text-primary">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">We couldn't load this right now. Try once more in a moment.</p><button onClick={onRetry} className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-retry">Try again</button></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary text-primary"><Sparkles size={21} /></div><h2 className="font-display text-xl font-bold text-primary">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{text}</p></div>;
}

function ClubCard({ club, saved, toggle }: { club: Club; saved: boolean; toggle: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-5 shadow-sm lift-on-hover" data-testid={`card-club-${club.id}`}>
      <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: club.color }} />
      <div className="flex items-start justify-between gap-4">
        <Link href={`/clubs/${club.id}`} className="flex min-w-0 items-center gap-3" data-testid={`link-club-${club.id}`}>
          <span className="grid size-12 shrink-0 place-items-center rounded-[14px] font-display text-sm font-bold" style={{ backgroundColor: `${club.color}20`, color: club.color }}>{club.shortName || initials(club.name)}</span>
          <span className="min-w-0"><span className="block truncate font-display text-lg font-bold text-primary">{club.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{club.category}</span></span>
        </Link>
        <SaveButton type="club" id={club.id} saved={saved} toggle={toggle} />
      </div>
      <p className="mt-5 line-clamp-2 min-h-[42px] text-sm leading-relaxed text-muted-foreground">{club.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
        <span className={`font-semibold ${club.membershipStatus === 'Open' ? 'text-emerald-700' : 'text-muted-foreground'}`}>{club.membershipStatus === 'Open' ? 'Recruiting now' : club.membershipStatus}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Users size={13} /> {club.memberCount.toLocaleString()} members</span>
      </div>
    </div>
  );
}

function EventCard({ event, saved, toggle, featured = false }: { event: Event; saved: boolean; toggle: () => void; featured?: boolean }) {
  const date = formatDay(event.date);
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm lift-on-hover ${featured ? 'p-6' : 'p-5'}`} data-testid={`card-event-${event.id}`}>
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: event.color }} />
      <div className="flex gap-4">
        <div className="flex h-[66px] w-[53px] shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-primary"><span className="font-mono-app text-[10px] font-medium tracking-[0.14em]">{date.month}</span><span className="font-display text-2xl font-bold leading-none">{date.day}</span></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.16em] text-accent">{event.category}</p><Link href={`/events/${event.id}`} className="mt-1 block font-display text-lg font-bold leading-tight text-primary hover:text-accent" data-testid={`link-event-${event.id}`}>{event.title}</Link></div><SaveButton type="event" id={event.id} saved={saved} toggle={toggle} /></div>
          <p className="mt-3 text-xs text-muted-foreground">{event.clubName}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 size={13} /> {event.startTime}–{event.endTime}</span><span className="flex items-center gap-1.5"><MapPin size={13} /> {event.venue}</span></div>
    </div>
  );
}

function Home() {
  const dashboard = useGetDashboard();
  const { saved, toggle, has } = useSaved();
  const summary = dashboard.data;
  return (
    <div className="page-enter mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <section className="relative overflow-hidden rounded-[26px] bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-12">
        <div className="absolute -right-12 -top-20 size-72 rounded-full border-[38px] border-sidebar-primary/20" /><div className="absolute -bottom-32 right-24 size-72 rounded-full border-[1px] border-sidebar-primary/15" />
        <div className="relative max-w-2xl">
          <p className="mb-4 font-mono-app text-[10px] uppercase tracking-[0.24em] text-sidebar-primary">Your campus, in one place</p>
          <h1 className="font-display text-4xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Find your people.<br /><span className="text-sidebar-primary">Show up for more.</span></h1>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-primary-foreground/70">Discover clubs that feel like you, see what's happening next, and get the details before you leave your room.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/clubs" className="inline-flex items-center gap-2 rounded-lg bg-sidebar-primary px-4 py-3 text-sm font-bold text-sidebar-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-discover-clubs">Explore clubs <ArrowUpRight size={16} /></Link><Link href="/events" className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/20 px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10" data-testid="link-see-events">See what's on <CalendarDays size={16} /></Link></div>
        </div>
      </section>

      {dashboard.isLoading && <div className="mt-8"><LoadingGrid label="Loading your campus overview" /></div>}
      {dashboard.isError && <div className="mt-8"><ErrorState onRetry={() => dashboard.refetch()} /></div>}
      {summary && <div className="mt-8 space-y-10">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['Clubs to explore', summary.clubCount, 'Start somewhere curious.'], ['Upcoming events', summary.eventCount, 'Plans for your calendar.'], ['Open recruitments', summary.openRecruitments, 'Ways to get involved.'], ['Happening today', summary.eventsToday, 'No reason to stay in.']].map(([label, value, sub], index) => <div key={label as string} className={`rounded-2xl border border-border bg-card p-5 ${index === 3 ? 'bg-secondary' : ''}`} data-testid={`stat-${index}`}><p className="font-mono-app text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl font-bold tracking-tight text-primary">{value as number}</p><p className="mt-1 text-xs text-muted-foreground">{sub as string}</p></div>)}
        </section>
        <section className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
          <div><div className="mb-4 flex items-end justify-between"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">A good place to start</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-primary">Clubs students are exploring</h2></div><Link href="/clubs" className="text-xs font-bold text-accent hover:underline" data-testid="link-all-clubs">View all <ChevronRight className="inline" size={14} /></Link></div><div className="grid gap-4 sm:grid-cols-2">{summary.featuredClubs?.slice(0, 4).map((club) => <ClubCard key={club.id} club={club} saved={has('club', club.id)} toggle={() => toggle('club', club.id)} />)}</div>{!summary.featuredClubs?.length && <EmptyState title="The club board is quiet" text="Check the directory for every student group on campus." />}</div>
          <div><div className="mb-4 flex items-end justify-between"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">Next up</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-primary">Worth leaving for</h2></div><Link href="/events" className="text-xs font-bold text-accent hover:underline" data-testid="link-all-events">Full calendar <ChevronRight className="inline" size={14} /></Link></div><div className="space-y-4">{summary.featuredEvents?.slice(0, 3).map((event) => <EventCard key={event.id} event={event} saved={has('event', event.id)} toggle={() => toggle('event', event.id)} featured />)}</div>{!summary.featuredEvents?.length && <EmptyState title="No plans on the board" text="The next good thing might be closer than you think." />}</div>
        </section>
      </div>}
    </div>
  );
}

function FilterBar({ search, setSearch, categories, category, setCategory, children }: { search: string; setSearch: (value: string) => void; categories: string[]; category: string; setCategory: (value: string) => void; children?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-muted px-3 py-2.5"><Search size={17} className="shrink-0 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search by name, interest, or keyword" aria-label="Search" data-testid="input-search" />{search && <button onClick={() => setSearch('')} aria-label="Clear search" data-testid="button-clear-search"><X size={15} className="text-muted-foreground" /></button>}</div><div className="flex items-center gap-2 overflow-x-auto"><Filter size={15} className="ml-1 shrink-0 text-muted-foreground" />{['All', ...categories].slice(0, 6).map((item) => <button key={item} onClick={() => setCategory(item === 'All' ? '' : item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${category === (item === 'All' ? '' : item) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`} data-testid={`button-filter-${item.toLowerCase().replace(/\s/g, '-')}`}>{item}</button>)}</div>{children}</div>;
}

function ClubsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'popular' | 'alphabetical' | 'recentlyUpdated'>('popular');
  const clubs = useListClubs({ search: search || undefined, category: category || undefined, sort });
  const { toggle, has } = useSaved();
  const categories = useMemo(() => Array.from(new Set((clubs.data || []).map((club) => club.category))), [clubs.data]);
  return <div className="page-enter mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><PageIntro eyebrow="The directory" title="Find your kind of people" description="A campus is only as big as the people you haven't met yet. Start with an interest, a question, or a hunch." action={<div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1"><span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort</span>{[['popular', 'Popular'], ['alphabetical', 'A–Z']].map(([value, label]) => <button key={value} onClick={() => setSort(value as typeof sort)} className={`rounded-md px-3 py-2 text-xs font-bold ${sort === value ? 'bg-secondary text-primary' : 'text-muted-foreground'}`} data-testid={`button-sort-${value}`}>{label}</button>)}</div>} /><FilterBar search={search} setSearch={setSearch} categories={categories} category={category} setCategory={setCategory} />{clubs.isLoading && <LoadingGrid label="Finding clubs" />}{clubs.isError && <ErrorState onRetry={() => clubs.refetch()} />}{clubs.data && !clubs.data.length && <EmptyState title="Nothing matched that search" text="Try a broader keyword or clear the filter to see more of campus." />}{clubs.data && clubs.data.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{clubs.data.map((club) => <ClubCard key={club.id} club={club} saved={has('club', club.id)} toggle={() => toggle('club', club.id)} />)}</div>}</div>;
}

function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [range, setRange] = useState<'today' | 'thisWeek' | 'thisMonth' | undefined>();
  const events = useListEvents({ search: search || undefined, category: category || undefined, freeOnly: freeOnly || undefined, dateRange: range });
  const { toggle, has } = useSaved();
  const categories = useMemo(() => Array.from(new Set((events.data || []).map((event) => event.category))), [events.data]);
  return <div className="page-enter mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><PageIntro eyebrow="The campus calendar" title="Make a plan worth keeping" description="The next workshop, match, screening, and open mic — with the details you actually need." action={<button onClick={() => setFreeOnly(!freeOnly)} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold ${freeOnly ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card text-primary'}`} data-testid="button-free-events"><Check size={14} /> Free events</button>} /><FilterBar search={search} setSearch={setSearch} categories={categories} category={category} setCategory={setCategory}><select value={range || ''} onChange={(event) => setRange((event.target.value || undefined) as typeof range)} className="rounded-lg border-0 bg-secondary px-3 py-2 text-xs font-bold text-primary outline-none" aria-label="Date range" data-testid="select-date-range"><option value="">Any time</option><option value="today">Today</option><option value="thisWeek">This week</option><option value="thisMonth">This month</option></select></FilterBar>{events.isLoading && <LoadingGrid label="Checking the calendar" />}{events.isError && <ErrorState onRetry={() => events.refetch()} />}{events.data && !events.data.length && <EmptyState title="No events found" text="Try changing the dates or searching for a different interest." />}{events.data && events.data.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{events.data.map((event) => <EventCard key={event.id} event={event} saved={has('event', event.id)} toggle={() => toggle('event', event.id)} />)}</div>}</div>;
}

function DetailHeader({ backHref, eyebrow, title, subtitle, color, action }: { backHref: string; eyebrow: string; title: string; subtitle: string; color: string; action?: React.ReactNode }) {
  return <section className="relative overflow-hidden bg-primary px-5 py-10 text-primary-foreground sm:px-8 lg:px-12"><div className="absolute -right-16 -top-24 size-80 rounded-full border-[42px] opacity-20" style={{ borderColor: color }} /><div className="relative mx-auto max-w-[1380px]"><Link href={backHref} className="mb-8 inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground/60 hover:text-primary-foreground" data-testid="link-back"><ChevronLeft size={16} /> Back</Link><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-3 font-mono-app text-[10px] uppercase tracking-[0.22em]" style={{ color }}>{eyebrow}</p><h1 className="max-w-3xl font-display text-4xl font-bold leading-[1] tracking-[-0.055em] sm:text-6xl">{title}</h1><p className="mt-4 text-sm text-primary-foreground/65">{subtitle}</p></div>{action}</div></div></section>;
}

function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const clubId = Number(id);
  const club = useGetClub(clubId, { query: { enabled: Boolean(clubId), queryKey: getGetClubQueryKey(clubId) } });
  const { toggle, has } = useSaved();
  if (club.isLoading) return <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-8 lg:px-12"><LoadingGrid label="Loading club details" /></div>;
  if (club.isError || !club.data) return <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-8 lg:px-12"><ErrorState onRetry={() => club.refetch()} title="We couldn't find that club." /></div>;
  const item = club.data;
  return <div className="page-enter"><DetailHeader backHref="/clubs" eyebrow={item.category} title={item.name} subtitle={`${item.memberCount.toLocaleString()} members · ${item.upcomingEventCount} upcoming events`} color={item.color} action={<SaveButton type="club" id={item.id} saved={has('club', item.id)} toggle={() => toggle('club', item.id)} />} /><div className="mx-auto grid max-w-[1380px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.35fr_.65fr] lg:px-12"><div className="space-y-8"><section><p className="mb-3 font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">Why it exists</p><h2 className="font-display text-2xl font-bold text-primary">The mission</h2><p className="mt-3 max-w-2xl text-base leading-8 text-muted-foreground">{item.mission}</p></section><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">Open roles</p><h2 className="mt-1 font-display text-2xl font-bold text-primary">Ways to get involved</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">{item.roles?.reduce((sum, role) => sum + role.openings, 0) || 0} openings</span></div><div className="mt-6 divide-y divide-border">{item.roles?.map((role) => <div key={role.title} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-primary">{role.title}</h3><p className="mt-1 text-sm text-muted-foreground">{role.responsibility}</p></div><span className="shrink-0 font-mono-app text-xs text-accent">{role.openings} open</span></div>)}</div></section></div><aside className="h-fit space-y-4 lg:sticky lg:top-24"><div className="rounded-2xl border border-border bg-card p-6"><p className="mb-5 font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">Club details</p><DetailLine label="Membership" value={item.membershipStatus} strong={item.membershipStatus === 'Open'} /><DetailLine label="Who can join" value={item.eligibility} /><DetailLine label="When they meet" value={item.meetingSchedule} /><DetailLine label="Office" value={item.officeLocation} /><DetailLine label="Faculty advisor" value={item.facultyAdvisor} /><a href={`mailto:${item.contactEmail}`} className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 transition-transform" data-testid="link-contact-club">Contact club <ArrowUpRight size={15} /></a></div><div className="rounded-2xl bg-secondary p-6"><p className="text-sm font-bold text-primary">New here?</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">You don't need a perfect reason to join. Turn up, ask a question, and take it from there.</p></div></aside></div></div>;
}

function DetailLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="border-b border-border py-3 last:border-0"><p className="font-mono-app text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-1 text-sm leading-relaxed ${strong ? 'font-bold text-emerald-700' : 'text-primary'}`}>{value}</p></div>;
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const event = useGetEvent(eventId, { query: { enabled: Boolean(eventId), queryKey: getGetEventQueryKey(eventId) } });
  const { toggle, has } = useSaved();
  if (event.isLoading) return <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-8 lg:px-12"><LoadingGrid label="Loading event details" /></div>;
  if (event.isError || !event.data) return <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-8 lg:px-12"><ErrorState onRetry={() => event.refetch()} title="We couldn't find that event." /></div>;
  const item = event.data;
  const register = () => { if (item.registrationUrl) window.open(item.registrationUrl, '_blank', 'noopener,noreferrer'); };
  return <div className="page-enter"><DetailHeader backHref="/events" eyebrow={`${item.category} · ${formatDate(item.date)}`} title={item.title} subtitle={`Hosted by ${item.clubName}`} color={item.color} action={<SaveButton type="event" id={item.id} saved={has('event', item.id)} toggle={() => toggle('event', item.id)} />} /><div className="mx-auto grid max-w-[1380px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.35fr_.65fr] lg:px-12"><div className="space-y-8"><section><p className="mb-3 font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">About the event</p><p className="max-w-2xl text-base leading-8 text-muted-foreground">{item.description}</p></section><section className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><Clock3 className="mb-8 text-accent" size={19} /><p className="font-mono-app text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Time</p><p className="mt-1 font-bold text-primary">{item.startTime}–{item.endTime}</p><p className="mt-1 text-sm text-muted-foreground">{formatDate(item.date)}</p></div><div className="rounded-2xl border border-border bg-card p-5"><MapPin className="mb-8 text-accent" size={19} /><p className="font-mono-app text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Venue</p><p className="mt-1 font-bold text-primary">{item.venue}</p></div></section></div><aside className="h-fit space-y-4 lg:sticky lg:top-24"><div className="rounded-2xl border border-border bg-card p-6"><div className="mb-5 flex items-center justify-between"><p className="font-mono-app text-[10px] uppercase tracking-[0.2em] text-accent">Registration</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.seatsLeft < 10 ? 'bg-accent/15 text-accent' : 'bg-secondary text-primary'}`}>{item.seatsLeft} seats left</span></div><DetailLine label="Entry fee" value={money(item.entryFee)} strong={item.entryFee === 0} /><DetailLine label="Register by" value={formatDate(item.registrationDeadline)} /><DetailLine label="Who can attend" value={item.registrationCriteria} /><DetailLine label="Duty leave" value={item.dutyLeave ? 'Available for this event' : 'Not provided'} /><button onClick={register} disabled={!item.registrationUrl} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-register-event">Register for this event <ArrowUpRight size={15} /></button></div></aside></div></div>;
}

function SavedPage() {
  const { saved, toggle, has } = useSaved();
  const clubs = useListClubs(undefined, { query: { queryKey: ['saved-clubs'] } });
  const events = useListEvents(undefined, { query: { queryKey: ['saved-events'] } });
  const savedClubs = (clubs.data || []).filter((club) => saved.some((item) => item.type === 'club' && item.id === club.id));
  const savedEvents = (events.data || []).filter((event) => saved.some((item) => item.type === 'event' && item.id === event.id));
  return <div className="page-enter mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><PageIntro eyebrow="Your shortlist" title="Saved for later" description="Keep the clubs and events that sparked something close. They'll stay here on this device." />{clubs.isLoading || events.isLoading ? <LoadingGrid label="Loading your saved list" /> : !saved.length ? <EmptyState title="Nothing saved yet" text="Tap the bookmark on any club or event to keep it close." /> : <div className="space-y-10">{savedClubs.length > 0 && <section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold text-primary">Clubs <span className="font-mono-app text-sm font-normal text-muted-foreground">/{savedClubs.length}</span></h2></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{savedClubs.map((club) => <ClubCard key={club.id} club={club} saved={has('club', club.id)} toggle={() => toggle('club', club.id)} />)}</div></section>}{savedEvents.length > 0 && <section><div className="mb-4"><h2 className="font-display text-2xl font-bold text-primary">Events <span className="font-mono-app text-sm font-normal text-muted-foreground">/{savedEvents.length}</span></h2></div><div className="grid gap-4 lg:grid-cols-2">{savedEvents.map((event) => <EventCard key={event.id} event={event} saved={has('event', event.id)} toggle={() => toggle('event', event.id)} />)}</div></section>}{(savedClubs.length + savedEvents.length) < saved.length && <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">Some saved items are no longer on the live campus board.</p>}</div>}</div>;
}

function Router() {
  const [location] = useLocation();
  return <AppShell><ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/clubs" component={ClubsPage} /><Route path="/clubs/:id" component={ClubDetail} /><Route path="/events" component={EventsPage} /><Route path="/events/:id" component={EventDetail} /><Route path="/saved" component={SavedPage} /><Route component={NotFound} /></Switch></ErrorBoundary></AppShell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;