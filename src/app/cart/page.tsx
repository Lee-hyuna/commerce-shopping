'use client';
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary';
import { CartList } from './_components/CartList';

// 페이지는 경계(로딩/에러)만 선언. 데이터 분기는 자식이 책임진다.
export default function CartPage() {
  return (
    <main>
      <h1>장바구니</h1>
      <AsyncBoundary
        pending={<p>불러오는 중…</p>}
        rejected={({ error, reset }) => (
          <div role="alert">
            <p>장바구니를 불러오지 못했어요.</p>
            <button onClick={reset}>다시 시도</button>
          </div>
        )}
      >
        <CartList />
      </AsyncBoundary>
    </main>
  );
}
