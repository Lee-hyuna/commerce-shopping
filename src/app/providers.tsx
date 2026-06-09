'use client';
import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';

export function Providers({ children }: { children: ReactNode }) {
  // QueryClient는 컴포넌트 내부 state로 1회 생성(요청 간 공유 방지).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, throwOnError: true }, // 에러는 ErrorBoundary로 위임
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>{children}</OverlayProvider>
    </QueryClientProvider>
  );
}
