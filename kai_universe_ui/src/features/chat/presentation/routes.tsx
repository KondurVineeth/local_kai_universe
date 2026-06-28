
import { ChatActivePage } from './components/ChatActivePage';
import { ChatIndexRedirect } from './components/ChatIndexRedirect';
import { ChatLayout } from './layouts/ChatLayout';

import type { RouteObject } from 'react-router-dom';

// Routes:
//   /chat            → auto-creates (or reuses an empty) thread, redirects to
//                      /chat/:threadId so the user always lands on the New
//                      Chat composer view instead of a welcome splash.
//   /chat/:threadId  → active conversation (ChatActivePage)
export const chatRoutes: RouteObject[] = [
  {
    path: 'chat',
    element: <ChatLayout />,
    children: [
      { index: true, element: <ChatIndexRedirect /> },
      { path: ':threadId', element: <ChatActivePage /> },
    ],
  },
];
