import { http, HttpResponse } from 'msw';

const CART = process.env.CART_API ?? 'http://cart-svc/api';
const PRODUCT = process.env.PRODUCT_API ?? 'http://product-svc/api';
const INVENTORY = process.env.INVENTORY_API ?? 'http://inventory-svc/api';
const PRICING = process.env.PRICING_API ?? 'http://pricing-svc/api';

const cartStore: Record<string, { itemId: string; productId: string; quantity: number; optionLabel?: string }[]> = {};

function getLines(cartId: string) {
  return (cartStore[cartId] ??= [
    { itemId: 'item-1', productId: 'prod-1', quantity: 2 },
    { itemId: 'item-2', productId: 'prod-2', quantity: 1, optionLabel: 'L / 블랙' },
    { itemId: 'item-3', productId: 'prod-3', quantity: 3, optionLabel: 'M / 블랙' },
  ]);
}

export const handlers = [
  http.get(`${CART}/carts/:cartId/lines`, ({ params }) => {
    return HttpResponse.json(getLines(params.cartId as string));
  }),

  http.post(`${CART}/carts/:cartId/lines`, async ({ params, request }) => {
    const body = await request.json() as { productId: string; quantity: number; optionLabel?: string };
    const lines = getLines(params.cartId as string);
    lines.push({ itemId: `item-${Date.now()}`, ...body });
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${CART}/carts/:cartId/lines/:itemId`, async ({ params, request }) => {
    const { quantity } = await request.json() as { quantity: number };
    const lines = getLines(params.cartId as string);
    const line = lines.find((l) => l.itemId === params.itemId);
    if (!line) return new HttpResponse(null, { status: 404 });
    line.quantity = quantity;
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${CART}/carts/:cartId/lines/:itemId`, ({ params }) => {
    const lines = getLines(params.cartId as string);
    cartStore[params.cartId as string] = lines.filter((l) => l.itemId !== params.itemId);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${CART}/carts/merge`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${PRODUCT}/products:batchGet`, async ({ request }) => {
    const { productIds } = await request.json() as { productIds: string[] };
    return HttpResponse.json(
      productIds.map((id, i) => ({
        productId: id,
        name: `상품 ${i + 1}`,
        thumbnailUrl: '',
        basePrice: 10000 * (i + 1),
        sellable: true,
      })),
    );
  }),

  http.post(`${INVENTORY}/stocks:batchGet`, async ({ request }) => {
    const { productIds } = await request.json() as { productIds: string[] };
    return HttpResponse.json(
      productIds.map((id) => ({ productId: id, status: 'IN_STOCK', available: true })),
    );
  }),

  http.post(`${PRICING}/quote`, async ({ request }) => {
    const { lines } = await request.json() as { lines: { productId: string; quantity: number }[] };
    return HttpResponse.json(
      lines.map((l, i) => ({
        productId: l.productId,
        unitPrice: 10000 * (i + 1),
        salePrice: 9000 * (i + 1),
      })),
    );
  }),
];
