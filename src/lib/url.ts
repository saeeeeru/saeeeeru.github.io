export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  if (path.startsWith('#')) return `${base}${path}`;
  return `${base}${path.replace(/^\//, '')}`;
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  const relative = withBase(path);
  if (!site) return relative;
  return new URL(relative, site).href;
}

export const isPreview = import.meta.env.BASE_URL !== '/';
