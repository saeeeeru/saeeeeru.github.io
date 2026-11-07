import fs from 'node:fs';
import path from 'node:path';
import { profile } from '../data/profile';

export type Repo = {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  updated: string;
  archived: boolean;
};

type RepoSnapshot = {
  fetchedAt: string;
  repos: Repo[];
};

const snapshotFile = path.join(process.cwd(), 'src/data/snapshots/repos.json');

function readSnapshot(): Repo[] {
  if (!fs.existsSync(snapshotFile)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(snapshotFile, 'utf8')) as RepoSnapshot;
    if (!Array.isArray(parsed.repos)) return [];
    return parsed.repos.filter((repo) => repo && repo.name && repo.url);
  } catch (error) {
    console.warn('[repos] snapshot unreadable', error);
    return [];
  }
}

function writeSnapshot(repos: Repo[]): void {
  fs.mkdirSync(path.dirname(snapshotFile), { recursive: true });
  const payload: RepoSnapshot = { fetchedAt: new Date().toISOString(), repos };
  fs.writeFileSync(snapshotFile, `${JSON.stringify(payload, null, 2)}\n`);
}

function mapRepo(record: Record<string, unknown>): Repo | null {
  if (record.private === true || record.fork === true) return null;
  const name = typeof record.name === 'string' ? record.name : '';
  const url = typeof record.html_url === 'string' ? record.html_url : '';
  if (!name || !url) return null;
  return {
    name,
    description: typeof record.description === 'string' ? record.description : null,
    url,
    language: typeof record.language === 'string' ? record.language : null,
    stars: typeof record.stargazers_count === 'number' ? record.stargazers_count : 0,
    updated: typeof record.updated_at === 'string' ? record.updated_at : '',
    archived: record.archived === true,
  };
}

export async function loadRepos(): Promise<Repo[]> {
  if (process.env.FEEDS_OFFLINE === '1') {
    const repos = readSnapshot();
    console.info(`[repos] ${repos.length} from snapshot (offline)`);
    return repos;
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'saeeeeru-portfolio',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const repos: Repo[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const endpoint = new URL(`https://api.github.com/users/${profile.github.user}/repos`);
      endpoint.searchParams.set('per_page', '100');
      endpoint.searchParams.set('page', String(page));
      endpoint.searchParams.set('sort', 'updated');
      endpoint.searchParams.set('type', 'owner');
      const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) throw new Error('unexpected GitHub response');
      for (const entry of data) {
        if (!entry || typeof entry !== 'object') continue;
        const repo = mapRepo(entry as Record<string, unknown>);
        if (repo) repos.push(repo);
      }
      if (data.length < 100) break;
    }
    if (process.env.UPDATE_SNAPSHOTS === '1') writeSnapshot(repos);
    console.info(`[repos] ${repos.length} from GitHub`);
    return repos;
  } catch (error) {
    const repos = readSnapshot();
    console.warn(`[repos] fetch failed, using ${repos.length} snapshot repos`, error);
    return repos;
  }
}

export function repoByName(repos: Repo[]): Map<string, Repo> {
  return new Map(repos.map((repo) => [repo.name, repo]));
}
