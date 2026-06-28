// An API token issued for the local server's authenticated endpoints. The
// clickable mock never issues real credentials — `secretPreview` is a
// display-only masked string. Domain-pure so the slice (seed list) and
// presentation (the Manage Tokens dialog) share one definition without
// crossing the architecture boundary.
export interface ApiToken {
  readonly id: string;
  readonly label: string;
  // Masked preview shown in the list, e.g. `zlu_sk_••••••4f2a`. The full
  // secret is only ever surfaced once, at creation time.
  readonly secretPreview: string;
  readonly createdAt: string; // ISO 8601
  readonly lastUsedAt: string | null; // ISO 8601, null = never used
  readonly revoked: boolean;
}

// Seed tokens so the Manage Tokens screen has realistic content on first
// open. Two active, one revoked — enough to exercise every row state.
export const SEED_API_TOKENS: readonly ApiToken[] = [
  {
    id: 'tok-seed-default',
    label: 'Default key',
    secretPreview: 'zlu_sk_••••••a91c',
    createdAt: '2026-05-10T09:14:00.000Z',
    lastUsedAt: '2026-05-19T17:42:00.000Z',
    revoked: false,
  },
  {
    id: 'tok-seed-ci',
    label: 'CI pipeline',
    secretPreview: 'zlu_sk_••••••3d70',
    createdAt: '2026-05-14T11:02:00.000Z',
    lastUsedAt: null,
    revoked: false,
  },
  {
    id: 'tok-seed-old',
    label: 'Laptop (revoked)',
    secretPreview: 'zlu_sk_••••••0e8b',
    createdAt: '2026-04-28T08:30:00.000Z',
    lastUsedAt: '2026-05-02T14:10:00.000Z',
    revoked: true,
  },
];
