import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * App theme provider (light/dark) backed by next-themes. Toggles the `dark`
 * class on <html>, which our CSS variables key off. Defaults to dark — the
 * expected first impression for a developer tool — but remembers the user's
 * choice and respects the OS setting.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="dp.theme"
    >
      {children}
    </NextThemesProvider>
  );
}
