# commerce-web — 장바구니 BFF (Toss 스타일)

선언적 데이터 페칭과 계층 분리를 핵심으로 하는 **Toss(토스) 프론트엔드 아키텍처**.

```
Browser
  AsyncBoundary (Suspense + ErrorBoundary)   ← 로딩/에러를 컴포넌트에서 분리
   └ useSuspenseQuery / useMutation(optimistic)
      └ services/cart (queries·mutations colocation, queryKey 팩토리)
         └ remotes/cart (ky + zod parse)      ← 통신 경계
            └ /api/bff/cart  (Next Route Handler = BFF 집계)
               └ server/clients (ky) ─▶ Cart · Product · Inventory · Pricing (MSA)
```

## 패턴 매핑 (Toss)
| 요소 | 위치 |
|------|------|
| `AsyncBoundary` (Suspense+ErrorBoundary) | `shared/ui/AsyncBoundary.tsx` |
| `useSuspenseQuery` 선언적 페칭 | `app/cart/_components/CartList.tsx` |
| queries/mutations 콜로케이션 + queryKey 팩토리 | `services/cart/*` |
| 낙관적 업데이트 + 롤백 | `services/cart/mutations.tsx` |
| `ky` HTTP + `zod` 경계 검증 | `remotes/cart.ts`, `models/cart.ts` |
| `overlay-kit` 선언적 토스트 | `services/cart/mutations.tsx` |
| BFF 집계 (REST Route Handler) | `app/api/bff/cart/**`, `server/cart/aggregate.ts` |

## 설계 포인트
- **계층 분리**: `remotes`(통신) → `services`(도메인 훅) → `components`. 컴포넌트는 성공 상태만 렌더.
- **경계 검증**: 네트워크 응답을 `zod`로 parse → 예상과 다른 데이터 조기 차단.
- **부분 실패 graceful degradation**: pricing/inventory 장애 시 항목은 노출, `degraded`로 신호.
- **게스트→로그인 병합**: `server/cart/guest-cart.ts` (HttpOnly 쿠키 cartId → 로그인 시 merge).
- **보안**: downstream 토큰은 `server-only` 경계 내부만. 로그에 고객 PII 미포함.

## 실행
```bash
npm install
npm run dev    # http://localhost:3000/cart
npm test       # aggregateCart 부분 실패 단위 테스트 (vitest)
```
> downstream MSA가 없으면 `*_API` 환경변수로 실제/mock 서버를 가리키거나
> MSW로 `/api/bff` 하위 응답을 가로채 프론트 단독 개발. 인증 연동은 `server/auth/session.ts` 자리표시자.
