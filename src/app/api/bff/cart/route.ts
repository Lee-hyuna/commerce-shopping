import { NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';
import { resolveGuestCartId } from '@/server/cart/guest-cart';
import { aggregateCart } from '@/server/cart/aggregate';
import { cartClient } from '@/server/clients/domain';
import { AddToCartInputSchema } from '@/models/cart';
import { toUserError } from '@/shared/errors';

export const runtime = 'nodejs';

async function ctx() {
  const session = await getSession();
  return session
    ? { cartId: session.cartId, isGuest: false, token: session.accessToken }
    : { cartId: await resolveGuestCartId(), isGuest: true, token: undefined };
}

// 장바구니 조회 (집계)
export async function GET() {
  try {
    const { cartId, isGuest, token } = await ctx();
    const cart = await aggregateCart(cartId, isGuest, token);
    return NextResponse.json(cart);
  } catch (err) {
    const e = toUserError(err);
    console.error('[BFF/cart] GET', e.code); // PII 미포함
    return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
  }
}

// 담기
export async function POST(request: Request) {
  try {
    const parsed = AddToCartInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ code: 'VALIDATION', message: '잘못된 요청입니다.' }, { status: 400 });
    }
    const { cartId, isGuest, token } = await ctx();
    await cartClient.addLine(cartId, parsed.data, token);
    const cart = await aggregateCart(cartId, isGuest, token);
    return NextResponse.json(cart, { status: 201 });
  } catch (err) {
    const e = toUserError(err);
    console.error('[BFF/cart] POST', e.code);
    return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
  }
}
