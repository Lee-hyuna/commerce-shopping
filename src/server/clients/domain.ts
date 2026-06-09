import 'server-only';
import { authHeaders, baseUrl, callUpstream, upstream } from './upstream';

// downstream 도메인 서비스 클라이언트. BFF 내부에서만 사용(server-only).
// 각 서비스는 독립 배포되는 마이크로서비스라고 가정.

export interface CartLine { itemId: string; productId: string; quantity: number; optionLabel?: string }
export interface ProductInfo { productId: string; name: string; thumbnailUrl: string; basePrice: number; sellable: boolean }
export interface StockInfo { productId: string; status: 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT'; available: boolean }
export interface PriceInfo { productId: string; unitPrice: number; salePrice: number }

const CART = baseUrl('CART_API', 'http://cart-svc/api');
const PRODUCT = baseUrl('PRODUCT_API', 'http://product-svc/api');
const INVENTORY = baseUrl('INVENTORY_API', 'http://inventory-svc/api');
const PRICING = baseUrl('PRICING_API', 'http://pricing-svc/api');

export const cartClient = {
  getLines: (cartId: string, token?: string) =>
    callUpstream('cart', () =>
      upstream.get(`${CART}/carts/${cartId}/lines`, { headers: authHeaders(token) }).json<CartLine[]>(),
    ),
  addLine: (cartId: string, body: { productId: string; quantity: number; optionLabel?: string }, token?: string) =>
    callUpstream('cart', () =>
      upstream.post(`${CART}/carts/${cartId}/lines`, { json: body, headers: authHeaders(token) }).json<void>(),
    ),
  updateLine: (cartId: string, itemId: string, quantity: number, token?: string) =>
    callUpstream('cart', () =>
      upstream.patch(`${CART}/carts/${cartId}/lines/${itemId}`, { json: { quantity }, headers: authHeaders(token) }).json<void>(),
    ),
  removeLine: (cartId: string, itemId: string, token?: string) =>
    callUpstream('cart', () =>
      upstream.delete(`${CART}/carts/${cartId}/lines/${itemId}`, { headers: authHeaders(token) }).json<void>(),
    ),
  merge: (guestCartId: string, userId: string, token?: string) =>
    callUpstream('cart', () =>
      upstream.post(`${CART}/carts/merge`, { json: { guestCartId, userId }, headers: authHeaders(token) }).json<void>(),
    ),
};

// 배칭 조회 (productIds 한 번에)
export const productClient = {
  getMany: (productIds: string[]) =>
    callUpstream('product', () =>
      upstream.post(`${PRODUCT}/products:batchGet`, { json: { productIds } }).json<ProductInfo[]>(),
    ),
};

export const inventoryClient = {
  getMany: (productIds: string[]) =>
    callUpstream('inventory', () =>
      upstream.post(`${INVENTORY}/stocks:batchGet`, { json: { productIds } }).json<StockInfo[]>(),
    ),
};

export const pricingClient = {
  quote: (lines: { productId: string; quantity: number }[], token?: string) =>
    callUpstream('pricing', () =>
      upstream.post(`${PRICING}/quote`, { json: { lines }, headers: authHeaders(token) }).json<PriceInfo[]>(),
    ),
};
