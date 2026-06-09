'use client';
import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cartQueryOptions } from '@/services/cart/queries';
import { useAddToCart } from '@/services/cart/mutations';
import { CartItemRow } from './CartItemRow';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

function AddProductForm() {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [optionLabel, setOptionLabel] = useState('');
  const { mutate: addToCart, isPending } = useAddToCart();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId.trim()) return;
    addToCart(
      { productId: productId.trim(), quantity, optionLabel: optionLabel.trim() || undefined },
      {
        onSuccess: () => {
          setProductId('');
          setQuantity(1);
          setOptionLabel('');
        },
      },
    );
  };

  return (
    <div>
      <p>장바구니가 비어 있습니다.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="productId">상품 ID</label>
          <input
            id="productId"
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="상품 ID를 입력하세요"
            required
          />
        </div>
        <div>
          <label htmlFor="quantity">수량</label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="optionLabel">옵션</label>
          <input
            id="optionLabel"
            type="text"
            value={optionLabel}
            onChange={(e) => setOptionLabel(e.target.value)}
            placeholder="옵션 (선택)"
          />
        </div>
        <button type="submit" disabled={isPending || !productId.trim()}>
          {isPending ? '추가 중...' : '상품 추가'}
        </button>
      </form>
    </div>
  );
}

export function CartList() {
  // useSuspenseQuery: data는 항상 존재(로딩/에러는 AsyncBoundary가 처리).
  const { data: cart } = useSuspenseQuery(cartQueryOptions());

  if (cart.items.length === 0) {
    return <AddProductForm />;
  }

  return (
    <section>
      {cart.degraded.length > 0 && (
        <p role="status">일부 정보(가격/재고)를 일시적으로 불러오지 못했습니다.</p>
      )}

      <ul>
        {cart.items.map((item) => (
          <CartItemRow key={item.itemId} item={item} />
        ))}
      </ul>

      <footer>
        <span>총 {cart.summary.itemCount}개</span>
        <span>할인 {won(cart.summary.discountTotal.amount)}</span>
        <strong>결제예정 {won(cart.summary.payable.amount)}</strong>
      </footer>
    </section>
  );
}
