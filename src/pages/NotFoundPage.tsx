import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <p className="text-muted-foreground">This page doesn’t exist.</p>
      {/* base-nova Button has no `asChild`, so style the Link with buttonVariants(). */}
      <Link to="/dashboard" className={buttonVariants()}>
        Back to dashboard
      </Link>
    </div>
  );
}
