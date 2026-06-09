import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/errors';

const lines = [
  { itemId: 'i1', productId: 'p1', quantity: 2 },
  { itemId: 'i2', productId: 'p2', quantity: 1 },
];

vi.mock('@/server/clients/domain', () => ({
  cartClient: { getLines: vi.fn(async () => lines) },
  productClient: {
    getMany: vi.fn(async () => [
      { productId: 'p1', name: 'A', thumbnailUrl: '', basePrice: 1000, sellable: true },
      { productId: 'p2', name: 'B', thumbnailUrl: '', basePrice: 2000, sellable: true },
    ]),
  },
  inventoryClient: {
    getMany: vi.fn(async () => [
      { productId: 'p1', status: 'IN_STOCK', available: true },
      { productId: 'p2', status: 'IN_STOCK', available: true },
    ]),
  },
  // pricing 서비스 장애 시뮬레이션
  pricingClient: { quote: vi.fn(async () => { throw new Error('pricing down'); }) },
}));

const { aggregateCart } = await import('./aggregate');

describe('aggregateCart (부분 실패 graceful degradation)', () => {
  it('cart가 존재하지 않으면(404) 빈 장바구니를 반환한다', async () => {
    const { cartClient } = await import('@/server/clients/domain');
    vi.mocked(cartClient.getLines).mockRejectedValueOnce(
      new AppError('CART_NOT_FOUND', '[cart] 404'),
    );
    const cart = await aggregateCart('new-cart', true);
    expect(cart.items).toHaveLength(0);
    expect(cart.degraded).toHaveLength(0);
    expect(cart.cartId).toBe('new-cart');
    expect(cart.isGuest).toBe(true);
  });

  it('pricing 실패 시에도 항목을 노출하고 degraded 신호를 준다', async () => {
    const cart = await aggregateCart('c1', true);

    expect(cart.items).toHaveLength(2);
    expect(cart.degraded).toContain('PRICING'); // 부분 실패 기록
    // 가격 서비스 없으면 product.basePrice로 폴백
    expect(cart.items[0].unitPrice.amount).toBe(1000);
    expect(cart.items[0].lineTotal.amount).toBe(2000); // 1000 * 2
    expect(cart.summary.payable.amount).toBe(4000); // 2000 + 2000
    expect(cart.items[0].available).toBe(true);
  });
});
