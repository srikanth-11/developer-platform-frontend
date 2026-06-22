# Frontend Build Notes

A running log of **what** we built, **why**, and the **technology/reasoning** behind each step —
the companion to `../backend/NOTES.md`. Read top-to-bottom to understand how the dashboard
was assembled.

The frontend is the **dashboard UI** for the Developer Platform API built in `../backend`.

**Backend contract (what the UI talks to):**
- Base URL: `http://localhost:3333/api`
- Auth: JWT **Bearer** token for dashboard routes; API keys (`x-api-key`) are for the gateway, not the UI.
- Key endpoints: `POST /auth/register`, `POST /auth/login` → `{ accessToken, user }`; `GET /auth/me` (Bearer).
- API docs/playground: `http://localhost:3333/docs`.

---

## Step 1 — Frontend Foundation (Vite + React 19 + TS + Tailwind v4 + shadcn/ui)

**Goal:** A booting, styled React app with a component system in place, so every later
feature page is built from consistent primitives instead of hand-rolled markup.

### What we did

1. **Scaffolded** Vite + React 19 + TypeScript (`frontend/`), sibling to `backend/`.

2. **Installed core dependencies**
   | Package | Why |
   |---|---|
   | `tailwindcss` v4 + `@tailwindcss/vite` | Utility-first styling via the official Vite plugin (no PostCSS config needed in v4) |
   | `@tanstack/react-query` | Server-state: caching, loading/error states, refetch — the backbone of every data page |
   | `axios` | HTTP client with interceptors (we attach the JWT centrally) |
   | `react-router-dom` v6 | Client-side routing + route guards |
   | shadcn/ui (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) | Accessible, copy-into-repo components we own and can restyle |

3. **Configured the path alias** `@/* → src/*` in `vite.config.ts` (resolve.alias) **and**
   `tsconfig.app.json` (baseUrl + paths). shadcn relies on this alias for its imports.

4. **Initialized shadcn/ui** (`npx shadcn@latest init`). It wrote `components.json`,
   `src/lib/utils.ts` (the `cn()` helper), a first `Button` component, and injected the
   Tailwind v4 theme tokens (CSS custom properties for colors, radius, sidebar, charts)
   into `src/index.css`. Style: **base-nova**, base color **neutral**, icon set **lucide**.

### Two blockers we hit (and the fix — worth understanding)

- **`shadcn init` crashed with "JS heap out of memory."** The CLI is heavy and this machine
  runs **Node 18**, where the default heap is smaller. **Fix:** raise the limit for the
  command — `NODE_OPTIONS=--max-old-space-size=4096 npx shadcn@latest init`.

- **Build failed: `@tailwindcss/oxide` "Cannot find native binding."** Tailwind v4's engine
  (`oxide`) ships as a **platform-specific native binary** delivered through npm *optional
  dependencies*. A known npm bug ([npm/cli#4828](https://github.com/npm/cli/issues/4828))
  sometimes skips installing the right one. **Fix:** install the matching binary explicitly —
  `npm i -D @tailwindcss/oxide-win32-x64-msvc@<oxide version>` (here `4.3.1`). (The nuclear
  alternative is deleting `node_modules` + `package-lock.json` and reinstalling.)

### Why these choices

- **React Query for server state, not Redux:** almost all of this app's state *is* server
  state (orgs, apps, keys, analytics). React Query gives caching, dedup, and
  loading/error handling for free; global client state is minimal (just the auth token).
- **axios + interceptors over raw `fetch`:** one place to attach `Authorization: Bearer`
  and one place to react to `401` (log out) — set up next, in Step 2.
- **shadcn/ui over a component library (MUI/AntD):** components are generated **into our repo**,
  so we read/own/restyle them; no opaque dependency, and they're built on Tailwind tokens.
- **Tailwind v4 `@tailwindcss/vite` plugin:** v4 moved config into CSS (`@theme`), so there's
  no `tailwind.config.js`/`postcss.config.js` to maintain.

### Verified
- `npm run build` (`tsc -b && vite build`) completes cleanly — TypeScript compiles and the
  Tailwind/shadcn CSS pipeline resolves (Geist font + theme tokens emitted).

---

## Step 2 — API Client + Environment

**Goal:** One configured HTTP client that every feature uses, which automatically
authenticates requests and handles token expiry — so feature code never repeats
auth plumbing.

### What we did

1. **Environment files** — `.env` (git-ignored, real local values) + `.env.example`
   (committed template), both with `VITE_API_BASE_URL=http://localhost:3333/api`.
   Vite only exposes vars prefixed `VITE_` to the browser bundle.

2. **`src/lib/env.ts`** — typed, validated access to env vars. Reading `import.meta.env`
   in exactly one place means a missing var throws a clear error here instead of
   surfacing as a confusing `undefined` baseURL later.

3. **`src/lib/token.ts`** — the single source of truth for the JWT, persisted in
   `localStorage` (`get/set/clear`). Survives page refresh.

4. **`src/lib/api.ts`** — the shared `axios` instance with two interceptors:
   - **request:** attaches `Authorization: Bearer <token>` when a token exists.
   - **response:** on **401**, clears the token and calls a registered
     `onUnauthorized` handler (wired by the auth provider in Step 3).
   - plus `getApiErrorMessage()` — normalizes the backend's `{ message: string | string[] }`
     error shape (string[] for validation errors) into one display string.

### Why these choices

- **Interceptors over per-call headers:** auth is attached and 401 handled in *one*
  place; no feature has to remember to send the token or handle logout.
- **Settable `onUnauthorized` handler** (instead of importing the router/auth here):
  avoids a circular import between the API client and the auth provider — the provider
  injects its behavior at startup.
- **`localStorage` token:** keeps the Bearer flow simple and matches the backend's
  header-based auth. (Documented trade-off vs. httpOnly cookies in `token.ts`.)

### Verified
- `tsc -b` passes — the client, env, and token modules compile.

---

## Step 3 — Authentication (React Query, Auth Context, Login/Register)

**Goal:** A real session: register/login against the backend, persist the JWT,
rehydrate the user on refresh, and expose `useAuth()` to the rest of the app.

### What we did

1. **`src/lib/query-client.ts`** — one shared `QueryClient` with dashboard-tuned
   defaults (`staleTime: 30s`, `retry: 1`, `refetchOnWindowFocus: false`).

2. **Added shadcn primitives** — `input`, `label`, `card`, `sonner` (toasts).

3. **Auth feature module** (`src/features/auth/`):
   - `types.ts` — `User`, `AuthResponse`, `LoginPayload`, `RegisterPayload` mirroring
     the backend contract (`User` = entity minus `passwordHash`).
   - `api.ts` — `login()`, `register()`, `getMe()` thin wrappers over the axios client.
   - `auth-context.ts` — the `AuthContext` + `useAuth()` hook (no JSX, so React Fast
     Refresh stays happy). `useAuth` throws if used outside the provider.
   - `auth-provider.tsx` — `AuthProvider` owns `user` + `status`
     (`loading | authenticated | unauthenticated`); exposes `login/register/logout`.
     On startup it validates an existing token via `/auth/me` (refresh keeps you in);
     it also registers `logout` as the axios **401** handler from Step 2.
   - `LoginPage.tsx` / `RegisterPage.tsx` — shadcn Card forms; errors surfaced via
     `toast.error(getApiErrorMessage(...))`; redirect to `/` on success.

### Why these choices

- **Context for auth, React Query for everything else:** the user/token is a tiny
  piece of *global client* state (Context fits); all the list/detail data is *server*
  state (React Query fits). Using the right tool for each avoids a bloated global store.
- **Split `auth-context.ts` (hook) from `auth-provider.tsx` (component):** the
  `react-refresh/only-export-components` lint rule wants a file to export *only*
  components for reliable HMR; separating them keeps fast refresh working.
- **Bootstrap via `/auth/me`:** a stored token might be expired/revoked — verifying it
  on load means we never show a logged-in UI backed by a dead token.
- **`status: 'loading'` exists** so Step 4's guard can avoid flashing the login page
  during that initial `/auth/me` check.

### Verified
- `tsc -b` passes. (Visual login/redirect flow is exercised once routing lands in Step 4.)

---

## Step 4 — App Shell + Protected Routing

**Goal:** Tie auth to navigation — a real signed-in app frame with a sidebar, guarded
routes, and the auth pages wired in, so the whole flow (register → land in dashboard →
navigate → sign out) works.

### What we did

1. **Providers in `main.tsx`** — nested `BrowserRouter > QueryClientProvider >
   AuthProvider > App`, plus the `<Toaster />` for global toasts. Router is outermost
   so the auth layer can navigate during login/logout.

2. **Route guards**
   - `ProtectedRoute` — shows a spinner while `status === 'loading'` (avoids a
     login-page flash on refresh), redirects to `/login` when unauthenticated, else
     renders the nested routes via `<Outlet />`.
   - `PublicOnlyRoute` — bounces already-authenticated users away from `/login`,`/register`.

3. **`DashboardLayout`** — fixed sidebar (brand + `NavLink` items with active styling
   via `cn()`) and a topbar showing the current user + a Sign-out button.

4. **Navigation config** (`components/layout/nav.ts`) — one `NAV_ITEMS` array (label,
   path, lucide icon) per backend feature area; the sidebar and the dashboard cards
   both render from it (single source of truth).

5. **Pages** — `DashboardPage` (welcome + quick-link cards), a generic `PlaceholderPage`
   for the not-yet-built areas, and `NotFoundPage` (404).

6. **`App.tsx` route tree** — public-only `/login`,`/register`; protected dashboard
   layout wrapping `/`, `/organizations`, `/applications`, `/api-keys`, `/analytics`,
   `/billing`, `/marketplace`, `/developer-portal`; catch-all 404. Removed the Vite
   starter `App.css`.

### Why these choices

- **Layout routes (`<Route element={<Guard/>}>` with `<Outlet/>`):** guards and the
  shell wrap many pages without repeating the wrapper on each route — the idiomatic
  React Router v6 pattern.
- **`loading` spinner in the guard:** the `/auth/me` bootstrap is async; gating on it
  prevents a jarring redirect-to-login on every refresh of a valid session.
- **`buttonVariants()` on a `Link` instead of `asChild`:** the base-nova `Button` is
  built on **Base UI** (not Radix Slot), so it has no `asChild`; styling the `Link`
  with the variant classes is the clean equivalent.

### Verified
- `npm run build` — 1992 modules transformed, clean.
- `npm run dev` — serves **HTTP 200**; `index.html` has `#root` + the entry module,
  and `/src/main.tsx` transforms without error.

**Milestone:** the app now runs. A user can register/login, land in the guarded
dashboard, navigate the sidebar, and sign out.

---

## Step 5 — Organizations Page (first feature page)

**Goal:** The first real, API-backed page — list the orgs you belong to and create
new ones. Organizations come first because applications, API keys, analytics, etc.
are all **org-scoped**, so this is the foundation the rest build on.

### Backend contract used
- `GET /organizations` → `[{ id, name, slug, role, joinedAt }]` (my orgs + my role)
- `POST /organizations` `{ name }` → full org (creator becomes **OWNER**)
- `GET /organizations/:id` → `{ id, name, slug, plan, requestsPerMinute, … }` (wired for later)

### What we did

1. **Added shadcn primitives** — `dialog`, `badge`, `skeleton`.

2. **`src/lib/enums.ts`** — shared mirrors of the backend `Role` / `Plan` enums
   (string values must match) + display-label maps. Used across many features.

3. **Organizations feature** (`src/features/organizations/`):
   - `types.ts` — `OrganizationSummary`, `Organization`, `CreateOrganizationPayload`.
   - `api.ts` — `listOrganizations`, `getOrganization`, `createOrganization`.
   - `hooks.ts` — `useOrganizations` (query), `useOrganization` (detail), and
     `useCreateOrganization` (mutation that **invalidates** the list on success).
     Centralized `organizationKeys` so queries and invalidation share the same keys.
   - `CreateOrganizationDialog.tsx` — modal form; `mutateAsync`, toast on success/error,
     closes + clears on success.
   - `OrganizationsPage.tsx` — handles all four UI states: **loading** (skeletons),
     **error** (message), **empty** (call-to-action), and **list** (cards with a role badge).

4. **Routed it in** — swapped the Organizations `PlaceholderPage` for the real page.

### Why these choices

- **Query-key factory + invalidate-on-mutation:** the canonical React Query pattern —
  create an org and the list refetches automatically; no manual cache surgery.
- **All four UI states explicitly:** loading/error/empty/data are real states a data
  page must handle; skeletons (not a spinner) keep layout stable.
- **Base UI dialog uses `render` + `open/onOpenChange`** (not Radix `asChild`) — matches
  the base-nova components; controlled `open` lets us close on a successful create.

### Verified
- `npm run build` — 2093 modules transformed, clean.
- ⏳ **Live API check pending:** verifying against a running backend needs Docker
  (Postgres + Redis) + the Nest server up. The HTTP contract is mirrored from the
  backend controller/DTOs; an end-to-end run (register → create org) is the next
  verification when the backend is started.

---

## Step 6 — Applications Page (+ Active-Organization concept)

**Goal:** Manage applications. Because apps live at
`/organizations/:orgId/applications`, the app first needs to know **which org**
you're working in — so this step introduces an active-org switcher, then the
applications list/create/delete UI on top of it.

### Backend contract used
- `GET /organizations/:orgId/applications` → `Application[]`
- `POST /organizations/:orgId/applications` `{ name, description? }` (**DEVELOPER+**)
- `DELETE /organizations/:orgId/applications/:id` (**ADMIN+**)
- (`GET/:id`, `PATCH/:id` wired in the API layer for later use.)

### What we did

1. **Active-organization context** (`features/organizations/`):
   - `active-org-context.ts` — `ActiveOrgContext` + `useActiveOrg()` hook.
   - `active-org-provider.tsx` — reads the orgs list, holds the selected `activeOrgId`
     **persisted to localStorage**, and self-heals (falls back to the first org if the
     stored id is stale/missing). Mounted **inside** the protected shell (it needs auth).
   - `OrgSwitcher.tsx` — a `Select` in the topbar; hidden until ≥1 org exists.

2. **Wired the provider into the protected shell** — `App.tsx` now wraps
   `DashboardLayout` in `<ActiveOrgProvider>`, so every org-scoped page can call
   `useActiveOrg()`; the switcher sits in the layout topbar.

3. **Role helpers** (`lib/enums.ts`) — `ROLE_RANK` + `roleAtLeast(role, required)`,
   mirroring the backend's rank logic.

4. **Applications feature** (`features/applications/`):
   - `types.ts`, `api.ts` (org-scoped), `hooks.ts` — `useApplications(orgId)` (only
     fetches once an org is selected, via `enabled`), `useCreateApplication`,
     `useDeleteApplication` (both invalidate the org-scoped list).
   - `CreateApplicationDialog.tsx` — name + optional description (added shadcn `textarea`).
   - `ApplicationsPage.tsx` — handles **no-org** (CTA to Organizations), loading,
     error, empty, and list states; create/delete buttons are **role-gated**
     (`roleAtLeast`) to match the server's `@Roles`.

5. **Routed it in** — replaced the Applications placeholder.

### Why these choices

- **Active org in Context + localStorage:** the selected tenant is small global client
  state every org-scoped page needs; persisting it keeps your place across refreshes.
- **Org-scoped query keys (`['applications', orgId]`):** switching orgs in the switcher
  automatically fetches that org's apps and caches each separately.
- **`enabled: !!orgId`:** avoids firing a request with an empty `:orgId` before an org
  is chosen.
- **Client-side role gating mirrors the server, doesn't replace it:** hiding a button a
  VIEWER can't use is UX; the backend `@Roles` guard is still the real enforcement.

### Verified
- `npm run build` — clean. (One advisory: main JS chunk is >500 kB; route-level
  code-splitting is a noted later optimization.)
- ⏳ Live end-to-end run still pending a running backend.

---

## Step 7 — API Keys Page (one-time secret reveal)

**Goal:** Generate, rotate, and revoke API keys for an application — with the
backend's **show-the-secret-once** security model done right in the UI.

### Backend contract used
Nested under app: `/organizations/:orgId/applications/:appId/api-keys`
- `GET` → masked `ApiKey[]` (`{ id, name, maskedKey, status, usageCount, lastUsedAt, expiresAt, … }`)
- `POST` `{ name, expiresInDays? }` (**DEVELOPER+**) → `CreatedApiKey` (= masked key **+ plaintext `key` + warning**, returned **once**)
- `POST /:keyId/revoke` (**DEVELOPER+**) → masked key
- `POST /:keyId/rotate` (**DEVELOPER+**) → `CreatedApiKey` (revokes old, returns a new secret once)

### What we did

1. **API Keys feature** (`features/api-keys/`):
   - `types.ts` — `ApiKey`, `CreatedApiKey` (the secret-bearing one), `ApiKeyStatus`.
   - `api.ts` / `hooks.ts` — list/create/revoke/rotate, **keyed by `(orgId, appId)`**.
   - `SecretRevealDialog.tsx` — the **one-time reveal**: shows the plaintext `key`
     with a copy-to-clipboard button + the backend's warning; opens whenever a
     `CreatedApiKey` is set. **Shared by both create and rotate.**
   - `CreateApiKeyDialog.tsx` — name + optional expiry; on success hands the
     `CreatedApiKey` up via `onCreated` (parent opens the reveal).
   - `ApiKeysPage.tsx` — an **application selector** (keys are per-app), a `Table`
     of keys (masked value, status badge, usage, last-used, expires), and
     role-gated **Rotate/Revoke** actions (disabled unless the key is `active`).
     Cascading empty states: no org → Organizations; no apps → Applications; no keys.

2. **Shared helpers** — `lib/format.ts` (`formatDate`, `formatCompact`), added shadcn `table`.

3. **Routed it in** — replaced the API Keys placeholder.

### Why these choices

- **One reveal component for create + rotate:** both return the same secret-bearing
  shape; centralizing it means the "store this now" UX is written once and the page
  just sets `revealed`.
- **App selector with self-healing default (`effectiveAppId`):** keys belong to an
  app, so the page picks the first app by default and recovers if the selection
  becomes invalid (e.g. after switching orgs) — no crash, no empty `:appId` request.
- **Actions disabled unless `status === 'active'`:** you can't revoke/rotate an
  already-revoked/expired key; the UI reflects what the server would allow.
- **Table over cards:** keys carry several columns (status/usage/dates) that read
  better in rows.

### Verified
- `npm run build` — clean (same >500 kB advisory).
- ⏳ Live end-to-end run still pending a running backend.

---

## Step 8 — Analytics Page (+ route-level code-splitting)

**Goal:** Visualize gateway usage for the active org — headline metrics, a traffic
time series, and the top endpoints — over a selectable time range.

### Backend contract used
- `GET /organizations/:orgId/analytics/overview?days=N` (VIEWER+) → one payload:
  - `summary` — `{ totalRequests, successfulRequests, failedRequests, errorRate (0–1), avgResponseMs, p95ResponseMs, maxResponseMs }`
  - `topEndpoints` — `[{ endpoint, method, count, avgResponseMs, errors }]`
  - `daily` — `[{ day: 'YYYY-MM-DD', total, errors, avgResponseMs }]`

### What we did

1. **Added shadcn `chart`** (installs **recharts**) for theming-aware charts.

2. **Analytics feature** (`features/analytics/`):
   - `types.ts`, `api.ts` (passes `?days` via axios `params`), `hooks.ts`
     (`useAnalyticsOverview`, keyed by `(orgId, days)`).
   - `AnalyticsPage.tsx` — a **range selector** (7/30/90 days), four **stat cards**
     (total requests, error rate %, avg + p95 latency), an **area chart** of daily
     requests vs. errors (`ChartContainer` + recharts `AreaChart`), and a **top-endpoints
     table**. Uses the **single `overview` call** (one request fills the whole page).
     Friendly "no traffic yet" copy when the gateway hasn't been hit.

3. **Route-level code-splitting** (`App.tsx`): converted the protected feature pages
   to `React.lazy` + `<Suspense>` (with a `PageLoader` spinner). Each page is now its
   own chunk; the heavy charting lib only loads when you open Analytics.

### Why these choices

- **Use `overview`, not three separate calls:** the backend already composes
  summary + top + daily server-side; one request = one loading state, no waterfall.
- **`React.lazy` per route:** before splitting, recharts ballooned the single bundle
  to ~903 kB. After: initial bundle ~530 kB and **Analytics is an isolated ~342 kB
  chunk** fetched on demand — users who never open Analytics never download recharts.
- **Stat cards + one time-series + a table:** the three classic "shapes" of an
  analytics view (scalars, trend, ranking) without over-building.

### Verified
- `npm run build` — clean; chunks confirm the split (`AnalyticsPage-*.js` separate
  from `index-*.js`). Remaining advisory is the vendor-heavy `index` chunk (React,
  Query, Router, Base UI) — further `manualChunks` splitting is an optional later tweak.
- ⏳ Live end-to-end run still pending a running backend.

---

## Step 9 — Billing Page

**Goal:** Show the org's plan, live usage vs. quota with projected cost, let an
owner change plan, and list/close invoices.

### Backend contract used
`/organizations/:orgId/billing`
- `GET /subscription` (VIEWER+) → `{ plan, status, monthlyQuota, pricePerMonth, overagePerThousand, currentPeriod… }`
- `GET /usage` (VIEWER+) → live bill `{ includedRequests, usedRequests, overageRequests, baseCost, overageCost, totalCost }`
- `POST /subscribe` `{ plan }` (**OWNER**) → updated subscription
- `GET /invoices` (VIEWER+) → `Invoice[]` (closed `BillingRecord`s)
- `POST /invoices/close` (**ADMIN+**) → new invoice

### What we did

1. **Billing feature** (`features/billing/`):
   - `types.ts` — `Subscription`, `Usage` (numbers), `Invoice` (**bigint/numeric come
     back as strings** from pg → typed `string`, parsed at display).
   - `plans.ts` — `PLAN_CATALOG` mirroring the backend `billing.constants.ts` so the
     picker can show quota/price for plans the org **isn't** on (the API only returns
     the current plan's terms).
   - `api.ts` / `hooks.ts` — subscription/usage/invoices queries + subscribe/close
     mutations (subscribe invalidates subscription **and** usage; close invalidates
     invoices + usage).
   - `BillingPage.tsx` — **current-period card** (usage `Progress` bar, overage note,
     base/overage/projected-total), a **3-plan picker** (current highlighted, owner-only
     switch), and an **invoices table** with an admin-only "Close current period".

2. **Format helpers** — added `formatNumber` + `formatCurrency` (`Intl`), shadcn `progress`.

3. **Routed it in** lazily (own chunk), replacing the Billing placeholder.

### Why these choices

- **`PLAN_CATALOG` mirrored on the client:** the picker needs terms for *all* plans,
  but the API only returns the active subscription's terms — so the catalog is mirrored
  (like the enums), with a note to keep both in sync.
- **Parse pg strings at the edge:** money/counts arrive as strings; typing them honestly
  as `string` and `Number(...)`-ing only when formatting avoids silent `"49.00" + 1`-style bugs.
- **Role-gated commercial actions:** plan change is **OWNER-only** and closing an invoice
  is **ADMIN+**, mirroring the backend `@Roles` exactly.
- **Invalidate usage after plan change:** projected cost depends on the plan, so the
  usage card must refetch when the plan switches.

### Verified
- `npm run build` — clean; `BillingPage-*.js` is its own ~10 kB chunk.
- ⏳ Live end-to-end run still pending a running backend.

---

## Step 10 — Marketplace Page

**Goal:** An API storefront — browse the public catalog, publish your org's APIs,
and manage subscriptions. Publishing/subscribing are **feature-flag gated** server-side.

### Backend contract used
- `GET /marketplace/apis?category=` (any logged-in) → public catalog
- `GET …/marketplace/apis` (VIEWER+) → APIs **this org published**
- `POST …/marketplace/apis` (DEVELOPER+, **feature `api_marketplace`**) → publish
- `GET …/marketplace/subscriptions` (VIEWER+) → `[{ subscriptionId, status, api, subscribedAt }]`
- `POST …/marketplace/subscriptions` `{ apiId }` (DEVELOPER+, **feature-gated**) → subscribe
- `DELETE …/marketplace/subscriptions/:id` (DEVELOPER+) → unsubscribe

### What we did

1. **Marketplace feature** (`features/marketplace/`):
   - `types.ts` (`MarketplaceApi`, `ApiSubscription`), `api.ts` (public catalog vs
     org-scoped routes), `hooks.ts` (browse/owned/subscriptions queries + publish/
     subscribe/unsubscribe mutations with targeted invalidation).
   - `PublishApiDialog.tsx` — name + base URL (required) and optional
     description/category/version/price.
   - `MarketplacePage.tsx` — **tabbed** (added shadcn `tabs`): **Browse** (category
     filter, Subscribe — shows "Subscribed" when already subscribed via a computed
     `Set`), **Published** (publish + owned list), **Subscriptions** (unsubscribe).
     Reusable `ApiCard` + small skeleton/empty/error helpers.

2. **Routed it in** lazily, replacing the Marketplace placeholder.

### Why these choices

- **Tabs for three related-but-distinct views** (discover / sell / consume) keeps one
  page instead of three routes, matching how the backend groups these endpoints.
- **Feature gating handled gracefully:** publish/subscribe can 403 when the
  `api_marketplace` flag is off — those errors surface through `getApiErrorMessage`
  as a toast rather than crashing; browsing/listing stay available (they aren't gated).
- **Computed `subscribedApiIds` set:** lets Browse show "Subscribed" vs. a Subscribe
  button without an extra request, derived from the subscriptions query already loaded.

### Verified
- `npm run build` — clean; `MarketplacePage-*.js` is its own ~23 kB chunk.
- ⏳ Live end-to-end run still pending a running backend.

---

## Step 11 — Developer Portal Page (final feature page)

**Goal:** Surface the platform's self-serve developer resources — interactive docs,
the OpenAPI spec, a downloadable Postman collection, and SDK-generation commands.

### Backend contract used
- `GET /developer-portal` → `{ name, resources: { interactiveDocs:'/docs', openApiSpec:'/docs-json', postmanCollection, sdks } }`
- `GET /developer-portal/sdks` → `{ message, openApiUrl, examples: [{ language, command }] }`
- `GET /developer-portal/postman` → Postman collection JSON

### What we did

1. **Derived the backend origin** in `lib/env.ts` (`apiOrigin = new URL(apiBaseUrl).origin`)
   — these resources are **server-absolute paths** (`/docs`, `/docs-json`) that live at
   the backend root, *not* under `/api`, so we link to `apiOrigin + path`.

2. **Developer Portal feature** (`features/developer-portal/`):
   - `types.ts`, `api.ts`, `hooks.ts` (index + sdk info cached with `staleTime: Infinity`
     since they're effectively static).
   - `DeveloperPortalPage.tsx` — three **resource cards** (open Swagger UI / view spec in
     new tabs; **download** the Postman collection via a Blob), and an **SDK section**
     listing each generator command with a copy-to-clipboard `CommandBlock`.

3. **Routed it in** lazily, replacing the last placeholder. Deleted the now-unused
   `PlaceholderPage` and its import (every nav route is a real page now).

### Why these choices

- **`apiOrigin`, not `apiBaseUrl`:** Swagger UI and the raw spec are served at the
  server root; building those links off the `/api` base would 404.
- **Blob download for Postman:** fetching through the api client (so it goes through
  our axios stack) then saving a Blob gives a proper file download named for the user,
  instead of dumping JSON in a browser tab.
- **`staleTime: Infinity` for portal metadata:** docs/SDK info don't change during a
  session — no reason to refetch.

### Verified
- `npm run build` — clean; `DeveloperPortalPage-*.js` is its own ~5 kB chunk.
- ⏳ Live end-to-end run still pending a running backend.

---

# 🎉 Frontend Feature-Complete (Steps 1–11)

Every sidebar route is now a real, API-backed page:

| Area | Highlights |
|---|---|
| **Auth** | register / login, JWT persistence, `/auth/me` session bootstrap, 401→logout |
| **Shell** | protected routing, sidebar, **active-org switcher**, role-aware UI |
| **Organizations** | list + create |
| **Applications** | list / create / delete (org-scoped, role-gated) |
| **API Keys** | create / rotate / revoke with **one-time secret reveal** |
| **Analytics** | range picker, stat cards, traffic chart, top endpoints |
| **Billing** | usage vs. quota, projected cost, plan switch, invoices |
| **Marketplace** | browse / publish / subscribe (feature-flag aware) |
| **Developer Portal** | docs, OpenAPI spec, Postman download, SDK commands |

Cross-cutting: one axios client (auth + 401 handling), React Query for all server
state, shadcn/ui (base-nova) components, **route-level code-splitting**, consistent
loading/error/empty states, and role gating mirrored from the backend `@Roles`.

---

## ✅ Live End-to-End Verification — PASSED

Ran against the full stack (Docker: Postgres + Redis + Nest backend on :3333) with
real JWT auth. Every endpoint the frontend consumes returned the exact shape its
TypeScript types expect:

- **Health** — `GET /api/health` → 200.
- **Auth** — `register` → `{ accessToken, user }`; `GET /auth/me` returns the user
  **without `passwordHash`**.
- **Organizations** — create → `{ id, name, slug, plan }`; list → my role is `owner`.
- **Applications** — create under org → `{ id, name, isActive }`.
- **API Keys** — create returns the **plaintext `key` once** + `maskedKey`; the list
  returns **masked only (no `key`)** — confirming the SecretRevealDialog model.
- **Analytics** — `overview` → `{ summary, topEndpoints, daily }`, summary fields match.
- **Billing** — `subscription` (plan/quota/price), `usage` (used/included/totalCost),
  `invoices` (array).
- **Marketplace** — public catalog, owned, and subscriptions all return arrays.
- **Developer Portal** — index `resources` keys + SDK examples (`typescript-axios`,
  `python`, `go`) match.
- **CORS** — preflight from `http://localhost:5173` → 204 with
  `Access-Control-Allow-Origin` echoed and credentials allowed.
- **Frontend** — `vite dev` boots clean and serves the app + lazy chunks (HTTP 200).

The frontend ↔ backend contract is verified end-to-end. 🎉

---

## Design Pass — Platform-grade visual identity

Reshaped the UI from the templated shadcn default into a cohesive, developer-platform
aesthetic (Vercel / Linear / Resend / Clerk family), guided by the `frontend-design`
skill. Concept: **"control room for your API traffic."**

### What changed
- **Design tokens** (`index.css`) — replaced the all-grayscale palette with an
  **indigo-violet brand accent**, **semantic status colors** (`--success`/`--warning`,
  plus destructive) as the only other saturated colors, and a **cohesive chart palette**
  (brand violet → … → error red). Tightened radius to `0.5rem`. Tuned light + dark.
- **Dark mode** — `next-themes` provider (defaults to dark), a topbar **theme toggle**;
  the sonner toasts now theme correctly too.
- **Typography** — added **Geist Mono** and a `--font-mono` token; all technical data
  (API keys, IDs, endpoints, metrics, money) is set in monospace — the signature.
- **App shell** (`DashboardLayout`) — branded sidebar (hexagon mark + wordmark),
  **grouped nav** (Resources / Insights / Build) with refined active states, a
  "systems operational" footer; sticky **topbar** with org switcher, theme toggle, and
  an account cluster (initials avatar + sign out).
- **Auth screens** — split-screen `AuthLayout` with a fixed dark brand panel featuring a
  **terminal/`curl` motif** (the product in its own vernacular) beside the form.
- **Dashboard** — now a real overview: live 30-day metric cards (mono numbers) + quick links.
- **Status semantics** — API-key and application statuses use success/warning/secondary
  badges; the new Badge `success`/`warning` variants back them.
- **Consistency** — shared `PageHeader`, aligned heading scale across all pages.

### Verified
- `npm run build` — clean (2778 modules). Dev server serves all new modules (HTTP 200).

---

## World-class UI/UX pass (bold & expressive)

Pushed the app toward best-in-class dev-tool feel (Linear / Vercel / Resend), guided by
the `frontend-design` skill. Added **framer-motion** + **cmdk**.

- **Motion foundation** — `lib/motion.ts` (`fadeInUp`, `staggerContainer`, `useCountUp`),
  `Reveal`/`RevealItem`, all reduced-motion aware; a global `prefers-reduced-motion` CSS
  guard. Expressive tokens in `index.css`: `.bg-aurora`, `.bg-grid`, `.text-gradient`,
  `.glow-primary`.
- **⌘K command palette** (`components/CommandPalette.tsx`) — the signature. Global
  ⌘K/Ctrl+K + topbar "Search…" pill; type-aware navigate + actions (create key / publish /
  payouts, toggle theme, docs, sign out).
- **Shell** — glassy topbar, **account dropdown** (replaces bare sign-out), **animated
  active-nav pill** (framer-motion `layoutId`), pinging "operational" dot, and
  **page transitions** (`AnimatePresence` keyed by pathname).
- **Shared primitives** — `StatCard` (animated count-up + glow), `EmptyState`.
- **Hero dashboard** — aurora+grid hero with greeting + primary CTA + ⌘K; animated metric
  band (type-aware: subscriber traffic / publisher earnings); staggered quick-links with
  hover-lift.
- **Auth** — drifting aurora blobs + grid, staggered reveal, the terminal motif.
- **Analytics** — gradient-filled area chart (`<linearGradient>`) with animated draw-in +
  count-up stat cards. Hover-lift on marketplace + billing cards; selected plan glows.

### Verified
- `npm run build` — clean. Dev server restarted (new deps), serves all new modules (200),
  no errors. Backend up; both seeded accounts render data.
- Reduced-motion respected (CSS guard + framer-motion `useReducedMotion`).

---
