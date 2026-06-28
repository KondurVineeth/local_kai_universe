import type { DocSection } from '../value-objects/DocSection';

export type HttpMethod = 'GET' | 'POST';

export interface DocPage {
  readonly slug: string;
  readonly title: string;
  readonly section: DocSection;
  readonly contentPath: string;
  readonly method?: HttpMethod;
  readonly body: string;
}
