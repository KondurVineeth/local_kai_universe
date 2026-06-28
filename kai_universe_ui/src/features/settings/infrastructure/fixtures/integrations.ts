// Seed catalogue for the Integrations → Tool Call Confirmation manager.
// These are the tools a user can add to the "run without confirmation"
// allow-list. The fixture is the *available* set; the slice tracks which
// ones the user has actually allowed.

export interface IntegrationToolFixture {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export const INTEGRATION_TOOL_CATALOG: readonly IntegrationToolFixture[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Query the web for up-to-date information',
  },
  {
    id: 'code-interpreter',
    name: 'Code Interpreter',
    description: 'Run sandboxed Python to compute results',
  },
  {
    id: 'file-read',
    name: 'File Reader',
    description: 'Read files from a user-selected directory',
  },
  {
    id: 'file-write',
    name: 'File Writer',
    description: 'Create or modify files on disk',
  },
  {
    id: 'shell',
    name: 'Shell Command',
    description: 'Execute shell commands on the local machine',
  },
  {
    id: 'fetch-url',
    name: 'Fetch URL',
    description: 'Download the contents of a given URL',
  },
];
