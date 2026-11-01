import { XMLParser } from 'fast-xml-parser';

export type Article = {
  title: string;
  url: string;
  date: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  isArray: (name) => name === 'item' || name === 'entry' || name === 'link',
});

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && '#text' in value) {
    return asText((value as { '#text': unknown })['#text']);
  }
  return '';
}

function asLink(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    const alternate = value.find((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const rel = (entry as { '@_rel'?: string })['@_rel'];
      return !rel || rel === 'alternate';
    });
    return asLink(alternate ?? value[0]);
  }
  if (value && typeof value === 'object') {
    const record = value as { '@_href'?: unknown; '#text'?: unknown };
    if (typeof record['@_href'] === 'string') return record['@_href'].trim();
    return asText(record['#text']);
  }
  return '';
}

function parseDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toISOString();
}

export function parseFeed(xml: string): Article[] {
  if (!xml.includes('<item') && !xml.includes('<entry')) {
    throw new Error('feed has no items');
  }

  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown[] } };
    feed?: { entry?: unknown[] };
  };

  const nodes = doc.rss?.channel?.item ?? doc.feed?.entry ?? [];
  const articles: Article[] = [];

  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const record = node as Record<string, unknown>;
    const title = asText(record.title);
    const url = asLink(record.link) || asText(record.guid);
    const date = parseDate(
      asText(record.pubDate) || asText(record.published) || asText(record.updated) || asText(record.isoDate),
    );
    if (!title || !url.startsWith('http')) continue;
    articles.push({ title, url, date });
  }

  articles.sort((a, b) => {
    if (a.date === b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? 1 : -1;
  });

  return articles;
}
