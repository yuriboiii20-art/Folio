/**
 * FOLIO URL routing
 * ---------------------------------------------------------------------------
 * The workspace is a single component with tab state, but the tabs are real
 * destinations that need shareable, linkable URLs:
 *
 *   /dashboard                  /analytics       /trash
 *   /subject-folders            /ai-studio       /settings#storage
 *   /subject-folders/<id>       /profile
 *
 * Vercel and the Vite dev server both fall back to index.html, so these are
 * safe to push with the History API.
 */

export type TabId =
  | 'dashboard'
  | 'home'
  | 'analytics'
  | 'ai-studio'
  | 'trash'
  | 'settings'
  | 'profile';

export const TAB_PATHS: Record<TabId, string> = {
  dashboard: '/dashboard',
  home: '/subject-folders',
  analytics: '/analytics',
  'ai-studio': '/ai-studio',
  trash: '/trash',
  settings: '/settings',
  profile: '/profile'
};

const PATH_TABS: Record<string, TabId> = Object.entries(TAB_PATHS).reduce(
  (acc, [tab, path]) => ({ ...acc, [path]: tab as TabId }),
  {} as Record<string, TabId>
);

export interface AppLocation {
  tab: TabId;
  folderId: string | null;
  /** The `#section` fragment, e.g. "storage" for /settings#storage. */
  section: string | null;
}

export const buildPath = (tab: TabId, folderId?: string | null, section?: string | null): string => {
  let path = TAB_PATHS[tab] || TAB_PATHS.dashboard;
  if (tab === 'home' && folderId) path += `/${encodeURIComponent(folderId)}`;
  if (section) path += `#${section}`;
  return path;
};

export const parseLocation = (): AppLocation => {
  const raw = window.location.pathname.replace(/\/+$/, '') || '/dashboard';
  const section = window.location.hash ? window.location.hash.replace(/^#/, '') : null;

  if (raw === '' || raw === '/') {
    return { tab: 'dashboard', folderId: null, section };
  }

  const folderMatch = raw.match(/^\/subject-folders\/(.+)$/);
  if (folderMatch) {
    return { tab: 'home', folderId: decodeURIComponent(folderMatch[1]), section };
  }

  return { tab: PATH_TABS[raw] || 'dashboard', folderId: null, section };
};

export interface NavigateOptions {
  folderId?: string | null;
  section?: string | null;
  replace?: boolean;
}

/** Push (or replace) the workspace URL without reloading the page. */
export const navigateTo = (tab: TabId, options: NavigateOptions = {}) => {
  const url = buildPath(tab, options.folderId, options.section);
  const currentUrl = window.location.pathname + window.location.hash;
  if (url === currentUrl) return;

  if (options.replace) window.history.replaceState({ tab }, '', url);
  else window.history.pushState({ tab }, '', url);
};

/** Subscribe to browser back/forward navigation. */
export const onLocationChange = (handler: (loc: AppLocation) => void): (() => void) => {
  const listener = () => handler(parseLocation());
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};

/** Absolute URL for sharing a destination with someone else. */
export const absoluteUrl = (tab: TabId, folderId?: string | null, section?: string | null): string =>
  `${window.location.origin}${buildPath(tab, folderId, section)}`;
