import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overlay } from 'overlay-kit';
import { cartRemote } from '@/remotes/cart';
import type { AddToCartInput, Cart } from '@/models/cart';
import { cartKeys } from './queries';

// 수량 변경 (낙관적 업데이트 + 실패 시 롤백 + 토스트).
export function useUpdateCartItem() {
  const qc = useQueryClient();
  const key = cartKeys.detail();
  // debounce: 연속 클릭 시 마지막 요청만 전송 (race condition 방지)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return new Promise<Cart>((resolve, reject) => {
        debounceRef.current = setTimeout(() => {
          cartRemote.updateQuantity(itemId, quantity).then(resolve).catch(reject);
        }, 300);
      });
    },

    onMutate: async ({ itemId, quantity }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Cart>(key);
      if (prev) {
        qc.setQueryData<Cart>(key, {
          ...prev,
          items: prev.items.map((i) =>
            i.itemId === itemId
              ? { ...i, quantity, lineTotal: { ...i.salePrice, amount: i.salePrice.amount * quantity } }
              : i,
          ),
        });
      }
      return { prev };
    },

    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(key, context.prev); // 롤백
      overlay.open(({ unmount }) => (
        <Toast message="수량 변경에 실패했어요. 다시 시도해 주세요." onClose={unmount} />
      ));
    },

    // 서버 응답을 단일 진실로 동기화 (가격/재고 재계산 반영)
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddToCartInput) => cartRemote.add(input),
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(), cart),
    onError: () =>
      overlay.open(({ unmount }) => (
        <Toast message="상품 추가에 실패했어요. 다시 시도해 주세요." onClose={unmount} />
      )),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => cartRemote.remove(itemId),
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(), cart),
    onError: () =>
      overlay.open(({ unmount }) => <Toast message="삭제에 실패했어요." onClose={unmount} />),
  });
}

// 데모용 간단 토스트 (실제론 TDS Toast 컴포넌트 사용)
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 2000);
    return () => clearTimeout(id);
  }, [onClose]);
  return <div role="alert" className="toast">{message}</div>;
}
