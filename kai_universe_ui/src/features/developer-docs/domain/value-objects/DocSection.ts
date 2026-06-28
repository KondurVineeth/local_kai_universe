export type DocSection =
  | 'top'
  | 'core'
  | 'rest'
  | 'openai-compat'
  | 'anthropic-compat';

export const DOC_SECTION_LABELS: Readonly<Record<DocSection, string>> = {
  top: '',
  core: 'Core',
  rest: 'ZL Universe REST API',
  'openai-compat': 'OpenAI Compatibility',
  'anthropic-compat': 'Anthropic Compatibility',
};

export const ORDERED_SECTIONS: readonly DocSection[] = [
  'top',
  'core',
  'rest',
  'openai-compat',
  'anthropic-compat',
];

export const COLLAPSIBLE_SECTIONS: readonly DocSection[] = [
  'core',
  'rest',
  'openai-compat',
  'anthropic-compat',
];
