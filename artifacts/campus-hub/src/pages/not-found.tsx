import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-[20px] bg-secondary text-accent"><Compass size={27} /></div>
        <p className="mt-7 font-mono-app text-[10px] uppercase tracking-[0.22em] text-accent">Wrong turn</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary">This page isn't on the board.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">The link may have moved, or this campus corner has not been mapped yet.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-return-home"><ArrowLeft size={15} /> Return to overview</Link>
      </div>
    </div>
  );
}
