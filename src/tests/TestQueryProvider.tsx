import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createTestQueryClient } from './createTestQueryClient';

export function TestQueryProvider({
   children,
   client = createTestQueryClient(),
}: {
   children: ReactNode;
   client?: QueryClient;
}) {
   return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
