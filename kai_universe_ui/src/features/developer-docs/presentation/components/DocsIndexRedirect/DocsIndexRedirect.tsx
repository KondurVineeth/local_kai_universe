import { Navigate } from 'react-router-dom';

import { useAppSelector } from '@shared/store/hooks';

import { selectLastVisitedSlug } from '../../store/selectors';

// Index route for /developer-docs. Resumes the last-visited doc page
// instead of always dropping the user on the introduction — `DocPagePage`
// records `lastVisitedSlug` on every visit, so a returning user lands
// where they left off. Falls back to `introduction` on first ever visit.
export function DocsIndexRedirect() {
  const lastVisitedSlug = useAppSelector(selectLastVisitedSlug);
  return <Navigate to={lastVisitedSlug ?? 'introduction'} replace />;
}
