import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { z } from 'astro/zod';

const pointSchema = z.union([
  z.string(),
  z.object({
    text: z.string(),
    children: z.array(z.string()).default([]),
  }),
]);

const timelineSchema = z.object({
  period: z.string(),
  org: z.string(),
  url: z.string().url().optional(),
  suffix: z.string().optional(),
  points: z.array(pointSchema).min(1),
});

const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  feed: z.string().url(),
});

const ProfileSchema = z.object({
  name: z.string(),
  oneLiner: z.string(),
  description: z.string(),
  site: z.string().url(),
  image: z.string(),
  imageAlt: z.string(),
  jobTitle: z.string(),
  intro: z.array(z.string()).min(1),
  now: z.object({
    asOf: z.string(),
    lead: z.string(),
    org: z.string(),
    orgUrl: z.string().url(),
    items: z
      .array(
        z.object({
          label: z.string(),
          detail: z.string().optional(),
        }),
      )
      .min(1),
  }),
  social: z
    .array(
      z.object({
        name: z.string(),
        href: z.string().min(1),
      }),
    )
    .min(1),
  writing: z.object({
    limit: z.number().int().positive().default(5),
    note: sourceSchema,
    sizu: sourceSchema,
  }),
  github: z.object({
    user: z.string(),
    exclude: z.array(z.string()).default([]),
  }),
  pinned: z.array(z.string()),
  themes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      repos: z.array(z.string()),
      writeups: z.array(z.string()),
    }),
  ),
  career: z.array(timelineSchema).min(1),
  education: z.array(timelineSchema).min(1),
  skills: z.array(z.string()).min(1),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type TimelineEntry = z.infer<typeof timelineSchema>;
export type TimelinePoint = z.infer<typeof pointSchema>;

const file = path.join(process.cwd(), 'src/data/profile.yaml');
const raw = load(fs.readFileSync(file, 'utf8'));

export const profile = ProfileSchema.parse(raw);

export function normalizePoint(point: TimelinePoint): { text: string; children: string[] } {
  if (typeof point === 'string') return { text: point, children: [] };
  return { text: point.text, children: point.children ?? [] };
}
