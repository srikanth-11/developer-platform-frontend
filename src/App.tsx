import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute';
import { RequireOrgType } from '@/components/RequireOrgType';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ActiveOrgProvider } from '@/features/organizations/active-org-provider';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OrganizationType } from '@/lib/enums';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Protected feature pages are lazy-loaded so each becomes its own chunk.
 * `React.lazy` needs a default export, so we map named exports through `.then`.
 */
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ApiKeysPage = lazy(() =>
  import('@/features/api-keys/ApiKeysPage').then((m) => ({ default: m.ApiKeysPage })),
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
const BillingPage = lazy(() =>
  import('@/features/billing/BillingPage').then((m) => ({ default: m.BillingPage })),
);
const MarketplacePage = lazy(() =>
  import('@/features/marketplace/MarketplacePage').then((m) => ({ default: m.MarketplacePage })),
);
const MyApisPage = lazy(() =>
  import('@/features/marketplace/MyApisPage').then((m) => ({ default: m.MyApisPage })),
);
const PayoutsPage = lazy(() =>
  import('@/features/marketplace/PayoutsPage').then((m) => ({ default: m.PayoutsPage })),
);
const DeveloperPortalPage = lazy(() =>
  import('@/features/developer-portal/DeveloperPortalPage').then((m) => ({
    default: m.DeveloperPortalPage,
  })),
);

/** Fallback while a lazily-loaded page chunk is fetched. */
function PageLoader() {
  return (
    <div className="flex h-full min-h-60 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Wrap a lazy page in a Suspense boundary. */
const page = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

/**
 * Route tree:
 *  - Public-only:  /login, /register
 *  - Protected:    dashboard layout; some sections gated by org TYPE
 *    (subscriber: applications/keys/analytics/marketplace; publisher: my-apis/payouts)
 *  - Catch-all:    404
 */
function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <ActiveOrgProvider>
              <DashboardLayout />
            </ActiveOrgProvider>
          }
        >
          {/* Shared */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={page(<DashboardPage />)} />
          <Route path="/billing" element={page(<BillingPage />)} />
          <Route path="/developer-portal" element={page(<DeveloperPortalPage />)} />

          {/* Subscriber-only */}
          <Route element={<RequireOrgType type={OrganizationType.SUBSCRIBER} />}>
            <Route path="/api-keys" element={page(<ApiKeysPage />)} />
            <Route path="/analytics" element={page(<AnalyticsPage />)} />
            <Route path="/marketplace" element={page(<MarketplacePage />)} />
          </Route>

          {/* Publisher-only */}
          <Route element={<RequireOrgType type={OrganizationType.PUBLISHER} />}>
            <Route path="/my-apis" element={page(<MyApisPage />)} />
            <Route path="/payouts" element={page(<PayoutsPage />)} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
