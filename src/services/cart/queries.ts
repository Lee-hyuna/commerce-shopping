import { queryOptions } from '@tanstack/react-query';
import { cartRemote } from '@/remotes/cart';

// queryKey 팩토리: 키를 한 곳에서 관리(오타/불일치 방지) — Toss 권장 패턴.
export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
};

// queryOptions로 옵션 객체화 → useSuspenseQuery / prefetch 양쪽에서 재사용.
export const cartQueryOptions = () =>
  queryOptions({
    queryKey: cartKeys.detail(),
    queryFn: () => cartRemote.get(),
    staleTime: 30_000,
  });
