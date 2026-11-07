import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const required = [
  'index.html',
  '404.html',
  'feed.xml',
  'robots.txt',
  'sitemap-index.xml',
  'about/index.html',
  'projects/index.html',
  'blog/index.html',
  'tags/index.html',
  'CONTRIBUTION/index.html',
  'dtc-tensorflow/index.html',
  'soccer-open-data-analysis/index.html',
  'scraping-from-jleague-data/index.html',
  'zenkoku-ugoki-toukei/index.html',
  'statsbomb-to-bigquery/index.html',
  'assets/images/profile.jpg',
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error('Missing build output:\n' + missing.map((file) => `  ${file}`).join('\n'));
  process.exit(1);
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const needles = [
  'さえない / Yamamuro Saeru',
  'サッカー狂のアナリティクスエンジニア',
  'AI-GTM',
  'コーポレートエンジニアリング',
  'プロダクトグロース',
  '山室',
  'かっこいいおっさんは、変わり続ける。',
  '御伝票',
  'おかわり',
  'MessiAnalyzer',
  'WyscoutAnalyzer',
  'StatsbombAnalyzer',
  'ScrapingFromJLeagueData',
  'statsbomb-to-bigquery',
  'note.com/deepfoot',
  'sizu.me/saeeeeru',
  '東福岡高等学校',
  '熊本大学',
  'ソフトバンク',
  '保険簿',
  'Ubie',
  'LayerX',
];

const absent = needles.filter((needle) => !home.includes(needle));
if (absent.length > 0) {
  console.error('Home page is missing expected text:\n' + absent.map((item) => `  ${item}`).join('\n'));
  process.exit(1);
}

const forbidden = ['Data Enabling', 'go-links', 'go links'];
const leaked = forbidden.filter((needle) => home.toLowerCase().includes(needle.toLowerCase()));
if (leaked.length > 0) {
  console.error('Home page includes text that should not be there:\n' + leaked.join('\n'));
  process.exit(1);
}

for (const redirect of ['about/index.html', 'projects/index.html', 'blog/index.html', 'tags/index.html']) {
  const html = fs.readFileSync(path.join(root, redirect), 'utf8');
  if (!/http-equiv="refresh"/i.test(html) && !html.includes('http-equiv="refresh"')) {
    console.error(`${redirect} is not a redirect`);
    process.exit(1);
  }
}

console.log('dist checks passed');
