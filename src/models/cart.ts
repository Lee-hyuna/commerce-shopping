import { z } from 'zod';

// BFF 응답 계약을 zod로 정의 → 런타임 검증 + 타입 추론(단일 진실).
// 네트워크 경계에서 parse 하여 "예상과 다른 응답"을 조기에 차단한다(Toss 방식).

export const MoneySchema = z.object({
  amount: z.number().int(), // 원 단위 정수
  currency: z.literal('KRW'),
});

export const StockStatusSchema = z.enum(['IN_STOCK', 'LOW_STOCK', 'SOLD_OUT']);

export const CartItemSchema = z.object({
  itemId: z.string(),
  productId: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  optionLabel: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  salePrice: MoneySchema,
  lineTotal: MoneySchema,
  stockStatus: StockStatusSchema,
  available: z.boolean(),
});

export const CartSchema = z.object({
  cartId: z.string(),
  isGuest: z.boolean(),
  items: z.array(CartItemSchema),
  summary: z.object({
    itemCount: z.number().int(),
    subtotal: MoneySchema,
    discountTotal: MoneySchema,
    payable: MoneySchema,
  }),
  // 부분 실패 신호 (가격/재고 일부 미반영)
  degraded: z.array(z.enum(['PRICING', 'INVENTORY', 'PRODUCT'])),
});

export type Money = z.infer<typeof MoneySchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

// 클라이언트 → BFF 입력 검증
export const AddToCartInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  optionLabel: z.string().optional(),
});
export type AddToCartInput = z.infer<typeof AddToCartInputSchema>;
