import 'server-only';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { cartClient } from '@/server/clients/domain';

const GUEST_COOKIE = 'guest_cart_id';

/** 비로그인 사용자를 위한 익명 cartId 확보(없으면 발급). */
export async function resolveGuestCartId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  if (!id) {
    id = randomUUID();
    jar.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });
  }
  return id;
}

/** 로그인 직후 호출: 게스트 카트를 사용자 카트로 병합하고 쿠키 정리.
 *  병합 실패 시 쿠키를 유지해 다음 요청에서 재시도 가능하게 함. */
export async function mergeGuestCartOnLogin(userId: string, authToken: string): Promise<void> {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) return;
  await cartClient.merge(guestId, userId, authToken);
  jar.delete(GUEST_COOKIE);
}
