import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/server/auth/session';
import { resolveGuestCartId } from '@/server/cart/guest-cart';
import { aggregateCart } from '@/server/cart/aggregate';
import { cartClient } from '@/server/clients/domain';
import { toUserError } from '@/shared/errors';

export const runtime = 'nodejs';

const UpdateSchema = z.object({ quantity: z.number().int().positive() });

async function ctx() {
  const session = await getSession();
  return session
    ? { cartId: session.cartId, isGuest: false, token: session.accessToken }
    : { cartId: await resolveGuestCartId(), isGuest: true, token: undefined };
}

type Params = { params: Promise<{ itemId: string }> };

// 수량 변경
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ code: 'VALIDATION', message: '수량이 올바르지 않습니다.' }, { status: 400 });
    }
    const { cartId, isGuest, token } = await ctx();
    await cartClient.updateLine(cartId, itemId, parsed.data.quantity, token);
    return NextResponse.json(await aggregateCart(cartId, isGuest, token));
  } catch (err) {
    const e = toUserError(err);
    console.error('[BFF/cart] PATCH', e.code);
    return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
  }
}

// 삭제
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const { cartId, isGuest, token } = await ctx();
    await cartClient.removeLine(cartId, itemId, token);
    return NextResponse.json(await aggregateCart(cartId, isGuest, token));
  } catch (err) {
    const e = toUserError(err);
    console.error('[BFF/cart] DELETE', e.code);
    return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
  }
}
