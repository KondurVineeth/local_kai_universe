import { createContext, useContext } from 'react';

// Sidebar-local context for the active search query. Read by ThreadRow /
// FolderRow to highlight matched substrings via <HighlightText>. Avoids
// prop-drilling the query through ThreadList → SectionList → ThreadRow­
// Connected → ThreadRow purely so a `<mark>` can render.
const SearchQueryContext = createContext<string>('');

export const SearchQueryProvider = SearchQueryContext.Provider;

export function useSearchQuery(): string {
  return useContext(SearchQueryContext);
}
