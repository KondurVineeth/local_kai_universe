import type { DocPage } from '../../domain/entities/DocPage';
import type { DocSection } from '../../domain/value-objects/DocSection';

export interface DocSearchHit {
  readonly slug: string;
  readonly title: string;
  readonly section: DocSection;
  readonly snippet: string;
  readonly score: number;
}

const SNIPPET_RADIUS = 60;
const MAX_HITS = 20;

export function searchDocs(
  docs: readonly DocPage[],
  query: string,
): readonly DocSearchHit[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return [];
  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const hits: DocSearchHit[] = [];
  for (const doc of docs) {
    const titleLc = doc.title.toLowerCase();
    const bodyLc = doc.body.toLowerCase();

    let score = 0;
    let snippet = '';

    for (const token of tokens) {
      if (titleLc.includes(token)) score += 10;
      const idx = bodyLc.indexOf(token);
      if (idx !== -1) {
        score += 1;
        if (snippet.length === 0) {
          const start = Math.max(0, idx - SNIPPET_RADIUS);
          const end = Math.min(doc.body.length, idx + token.length + SNIPPET_RADIUS);
          const raw = doc.body.slice(start, end).replace(/\s+/g, ' ').trim();
          snippet = `${start > 0 ? '…' : ''}${raw}${end < doc.body.length ? '…' : ''}`;
        }
      }
    }

    if (score > 0) {
      hits.push({
        slug: doc.slug,
        title: doc.title,
        section: doc.section,
        snippet: snippet || doc.title,
        score,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, MAX_HITS);
}
