import 'server-only';
import {
  cartClient, inventoryClient, pricingClient, productClient,
  type CartLine, type PriceInfo, type ProductInfo, type StockInfo,
} from '@/server/clients/domain';
import type { Cart, CartItem } from '@/models/cart';
import { AppError } from '@/shared/errors';

const KRW = (amount: number): Cart['summary']['subtotal'] => ({ amount, currency: 'KRW' });

/**
 * BFF 집계: 카트 라인(필수) + 상품/재고/가격(병렬, 부분 실패 허용)을
 * 화면용 단일 응답으로 조합한다.
 */
export async function aggregateCart(cartId: string, isGuest: boolean, token?: string): Promise<Cart> {
  let lines: CartLine[];
  try {
    lines = await cartClient.getLines(cartId, token);
  } catch (err) {
    if (err instanceof AppError && err.code === 'CART_NOT_FOUND') {
      return emptyCart(cartId, isGuest);
    }
    throw err;
  }
  if (lines.length === 0) return emptyCart(cartId, isGuest);

  const productIds = lines.map((l) => l.productId);
  const degraded: Cart['degraded'] = [];

  const [products, stocks, prices] = await Promise.allSettled([
    productClient.getMany(productIds),
    inventoryClient.getMany(productIds),
    pricingClient.quote(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })), token),
  ]);

  const productMap = byId(settledOr(products, degraded, 'PRODUCT', [] as ProductInfo[]), (p) => p.productId);
  const stockMap = byId(settledOr(stocks, degraded, 'INVENTORY', [] as StockInfo[]), (s) => s.productId);
  const priceMap = byId(settledOr(prices, degraded, 'PRICING', [] as PriceInfo[]), (p) => p.productId);

  const items: CartItem[] = lines.map((l: CartLine) => {
    const p = productMap.get(l.productId);
    const stock = stockMap.get(l.productId);
    const price = priceMap.get(l.productId);
    const unit = price?.unitPrice ?? p?.basePrice ?? 0;
    const sale = price?.salePrice ?? unit;
    return {
      itemId: l.itemId,
      productId: l.productId,
      name: p?.name ?? '(상품 정보 없음)',
      thumbnailUrl: p?.thumbnailUrl ?? '',
      optionLabel: l.optionLabel,
      quantity: l.quantity,
      unitPrice: KRW(unit),
      salePrice: KRW(sale),
      lineTotal: KRW(sale * l.quantity),
      stockStatus: stock?.status ?? 'IN_STOCK',
      available: (stock?.available ?? true) && (p?.sellable ?? true),
    };
  });

  return { cartId, isGuest, items, summary: summarize(items), degraded };
}

function settledOr<T>(r: PromiseSettledResult<T>, degraded: Cart['degraded'], tag: Cart['degraded'][number], fallback: T): T {
  if (r.status === 'fulfilled') return r.value;
  degraded.push(tag); // 부분 실패 기록(전체는 살림)
  console.error(`[BFF/cart] degraded:${tag}`, (r.reason as Error)?.message); // PII 미포함
  return fallback;
}

function byId<T>(items: T[], key: (t: T) => string): Map<string, T> {
  return new Map(items.map((i) => [key(i), i]));
}

function summarize(items: CartItem[]): Cart['summary'] {
  const subtotal = items.reduce((s, i) => s + i.unitPrice.amount * i.quantity, 0);
  const payable = items.reduce((s, i) => s + i.lineTotal.amount, 0);
  return {
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: KRW(subtotal),
    discountTotal: KRW(subtotal - payable),
    payable: KRW(payable),
  };
}

function emptyCart(cartId: string, isGuest: boolean): Cart {
  return {
    cartId, isGuest, items: [],
    summary: { itemCount: 0, subtotal: KRW(0), discountTotal: KRW(0), payable: KRW(0) },
    degraded: [],
  };
}
