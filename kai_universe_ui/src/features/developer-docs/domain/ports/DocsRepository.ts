import type { DocPage } from '../entities/DocPage';

export interface DocsRepository {
  listAll(): readonly DocPage[];
  getBySlug(slug: string): DocPage | null;
}
