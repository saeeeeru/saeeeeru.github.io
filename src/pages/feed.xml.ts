import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';
import { withBase } from '../lib/url';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async ({ site }) => {
  const projects = (await getCollection('projects')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  const origin = site ?? new URL(profile.site);
  const channelLink = new URL(withBase('/'), origin).href;
  const items = projects
    .map((project) => {
      const link = new URL(withBase(`/${project.id}/`), origin).href;
      const date = project.data.date.toUTCString();
      return `    <item>
      <title>${escapeXml(project.data.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(project.data.summary)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(profile.name)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(profile.description)}</description>
    <language>ja</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
