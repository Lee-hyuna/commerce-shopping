import 'server-only';
import { getSession } from '@/server/auth/session';
import { resolveGuestCartId } from '@/server/cart/guest-cart';

export async function getCartContext() {
  const session = await getSession();
  return session
    ? { cartId: session.cartId, isGuest: false, token: session.accessToken }
    : { cartId: await resolveGuestCartId(), isGuest: true, token: undefined };
}
