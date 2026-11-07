import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const rawBase = process.env.BASE_PATH?.trim() || '/';
const base = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const homePath = base === '/' ? '/' : `${base}/`;
const sectionPath = (id) => (base === '/' ? `/#${id}` : `${base}/#${id}`);

const legacyRedirects = {
  '/about': sectionPath('career'),
  '/projects': sectionPath('projects'),
  '/blog': sectionPath('writing'),
  '/tags': sectionPath('projects'),
  '/CONTRIBUTION': homePath,
};

export default defineConfig({
  site: 'https://saeeeeru.github.io',
  base,
  trailingSlash: 'always',
  output: 'static',
  redirects: legacyRedirects,
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.endsWith('/robots.txt') || path.endsWith('/feed.xml')) return false;
        return !/\/(about|projects|blog|tags|CONTRIBUTION)\/$/.test(path);
      },
    }),
  ],
  build: {
    format: 'directory',
    assets: 'astro',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
