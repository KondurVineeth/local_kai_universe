import { ORDERED_DOC_PAGES } from '../fixtures/manifest';

import type { DocPage } from '../../domain/entities/DocPage';
import type { DocsRepository } from '../../domain/ports/DocsRepository';

export class FixtureDocsRepository implements DocsRepository {
  private readonly bySlug: ReadonlyMap<string, DocPage>;

  constructor(private readonly all: readonly DocPage[] = ORDERED_DOC_PAGES) {
    this.bySlug = new Map(all.map((p) => [p.slug, p]));
  }

  listAll(): readonly DocPage[] {
    return this.all;
  }

  getBySlug(slug: string): DocPage | null {
    return this.bySlug.get(slug) ?? null;
  }
}
