import ky from 'ky';
import { CartSchema, type AddToCartInput, type Cart } from '@/models/cart';

// 클라이언트 → BFF 통신 계층(remotes). same-origin이므로 쿠키 자동 전송.
// SSR 환경에서는 origin이 없어 상대경로를 URL로 해석할 수 없으므로 절대 URL로 변환.
const bffBase =
  typeof window === 'undefined'
    ? `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/bff`
    : '/api/bff';

const api = ky.create({ prefixUrl: bffBase, timeout: 10_000, credentials: 'same-origin' });

// 응답을 zod로 parse → 런타임 검증. 스키마 불일치 시 즉시 throw(경계에서 차단).
const parseCart = async (res: Response): Promise<Cart> => CartSchema.parse(await res.json());

export const cartRemote = {
  get: () => api.get('cart').then(parseCart),
  add: (input: AddToCartInput) => api.post('cart', { json: input }).then(parseCart),
  updateQuantity: (itemId: string, quantity: number) =>
    api.patch(`cart/items/${itemId}`, { json: { quantity } }).then(parseCart),
  remove: (itemId: string) => api.delete(`cart/items/${itemId}`).then(parseCart),
};
