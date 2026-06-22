import { Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Split-screen auth shell: a dark brand panel with a slowly-drifting aurora and a
 * terminal motif (the product in its own vernacular) beside the form. The panel
 * collapses on small screens, leaving the form with a compact brand mark.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-zinc-100 lg:flex">
        {/* Drifting aurora */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-500/15 blur-3xl"
          animate={{ x: [0, -24, 0], y: [0, -16, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />

        <motion.div
          className="relative flex items-center gap-2.5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Hexagon className="size-4.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Developer Platform</span>
        </motion.div>

        <motion.div
          className="relative space-y-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            The API gateway and developer platform for modern teams.
          </h2>
          <div className="max-w-md overflow-hidden rounded-lg border border-white/10 bg-black/40 font-mono text-[13px] shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-yellow-400/80" />
              <span className="size-2.5 rounded-full bg-green-400/80" />
              <span className="ml-2 text-xs text-zinc-500">request</span>
            </div>
            <pre className="overflow-x-auto p-4 leading-relaxed text-zinc-300">
              <span className="text-zinc-500">$</span> curl https://api.devplatform.io/v1/users{'\n'}
              {'   '}-H <span className="text-primary">"Authorization: Bearer dk_live_••••"</span>
              {'\n\n'}
              <span className="text-green-400">200 OK</span>{' '}
              <span className="text-zinc-500">· 48ms · 5,000 req/min</span>
            </pre>
          </div>
        </motion.div>

        <div className="relative flex items-center gap-2 text-xs text-zinc-500">
          <span className="size-1.5 rounded-full bg-green-400" />
          All systems operational
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hexagon className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Developer Platform</span>
          </div>
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
