import { createContext, useContext, type ReactNode } from 'react';

import type { Container } from './container';

const ContainerContext = createContext<Container | null>(null);

export interface ContainerProviderProps {
  readonly value: Container;
  readonly children: ReactNode;
}

export function ContainerProvider({ value, children }: ContainerProviderProps) {
  return <ContainerContext.Provider value={value}>{children}</ContainerContext.Provider>;
}

export function useContainer(): Container {
  const ctx = useContext(ContainerContext);
  if (!ctx) {
    throw new Error('useContainer() called outside of <ContainerProvider>. Mount it at the app root.');
  }
  return ctx;
}
