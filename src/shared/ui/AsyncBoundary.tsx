'use client';
import { type ReactNode } from 'react';
import { ErrorBoundary, Suspense } from '@suspensive/react';

// Toss 시그니처 패턴: 로딩(Suspense)과 에러(ErrorBoundary)를 한 컴포넌트로 묶어
// 자식은 "성공 상태"만 선언적으로 렌더링한다. (분기 if문 제거)
interface AsyncBoundaryProps {
  pending: ReactNode;
  rejected: (props: { error: Error; reset: () => void }) => ReactNode;
  children: ReactNode;
}

export function AsyncBoundary({ pending, rejected, children }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={({ error, reset }) => <>{rejected({ error, reset })}</>}>
      <Suspense fallback={pending}>{children}</Suspense>
    </ErrorBoundary>
  );
}
