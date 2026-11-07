import fs from 'node:fs';
import path from 'node:path';
import { profile } from '../data/profile';
import { parseFeed, type Article } from './rss';

type Snapshot = {
  fetchedAt: string;
  items: Article[];
};

const snapshotDir = path.join(process.cwd(), 'src/data/snapshots');

function snapshotPath(name: string): string {
  return path.join(snapshotDir, `${name}.json`);
}

function readSnapshot(name: string): Article[] {
  const file = snapshotPath(name);
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Snapshot;
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items.filter((item) => item && item.title && item.url);
  } catch (error) {
    console.warn(`[writing] snapshot unreadable: ${name}`, error);
    return [];
  }
}

function writeSnapshot(name: string, items: Article[]): void {
  fs.mkdirSync(snapshotDir, { recursive: true });
  const payload: Snapshot = { fetchedAt: new Date().toISOString(), items };
  fs.writeFileSync(snapshotPath(name), `${JSON.stringify(payload, null, 2)}\n`);
}

async function loadSource(name: 'note' | 'sizu', feedUrl: string, limit: number): Promise<Article[]> {
  if (process.env.FEEDS_OFFLINE === '1') {
    const items = readSnapshot(name).slice(0, limit);
    console.info(`[writing] ${name}: ${items.length} from snapshot (offline)`);
    return items;
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'saeeeeru-portfolio',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const items = parseFeed(xml).slice(0, limit);
    if (process.env.UPDATE_SNAPSHOTS === '1') writeSnapshot(name, items);
    console.info(`[writing] ${name}: ${items.length} from feed`);
    return items;
  } catch (error) {
    const items = readSnapshot(name).slice(0, limit);
    console.warn(`[writing] ${name}: feed failed, using ${items.length} snapshot items`, error);
    return items;
  }
}

export async function loadWriting(): Promise<{ note: Article[]; sizu: Article[] }> {
  const limit = profile.writing.limit;
  const [note, sizu] = await Promise.all([
    loadSource('note', profile.writing.note.feed, limit),
    loadSource('sizu', profile.writing.sizu.feed, limit),
  ]);
  return { note, sizu };
}
