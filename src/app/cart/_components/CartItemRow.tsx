'use client';
import { memo, useCallback } from 'react';
import type { CartItem } from '@/models/cart';
import { useRemoveCartItem, useUpdateCartItem } from '@/services/cart/mutations';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

function CartItemRowBase({ item }: { item: CartItem }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const busy = update.isPending || remove.isPending;

  const changeQty = useCallback(
    (quantity: number) => {
      if (quantity < 1) return;
      update.mutate({ itemId: item.itemId, quantity });
    },
    [item.itemId, update],
  );

  const handleRemove = useCallback(() => {
    remove.mutate(item.itemId);
  }, [item.itemId, remove]);

  return (
    <li aria-busy={busy}>
      <span>{item.name}</span>
      {item.optionLabel && <small> · {item.optionLabel}</small>}

      <button onClick={() => changeQty(item.quantity - 1)} disabled={busy}>-</button>
      <span>{item.quantity}</span>
      <button onClick={() => changeQty(item.quantity + 1)} disabled={busy || !item.available}>+</button>

      <strong>{won(item.lineTotal.amount)}</strong>
      {!item.available && <em> 품절</em>}

      <button onClick={handleRemove} disabled={busy}>삭제</button>
    </li>
  );
}

export const CartItemRow = memo(CartItemRowBase);
