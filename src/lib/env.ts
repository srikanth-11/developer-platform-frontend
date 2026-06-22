/**
 * Centralized, typed access to environment variables.
 *
 * Reading `import.meta.env` in one place (instead of scattering string literals)
 * means a missing/renamed var fails here with a clear message, and the rest of
 * the app gets a typed `env` object.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Add it to frontend/.env (see .env.example).`,
    );
  }
  return value;
}

const apiBaseUrl = required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL);

export const env = {
  apiBaseUrl,
  // Backend origin (scheme+host+port) without the /api prefix — used to link to
  // server-absolute resources like Swagger UI (/docs) and /docs-json.
  apiOrigin: new URL(apiBaseUrl).origin,
} as const;
