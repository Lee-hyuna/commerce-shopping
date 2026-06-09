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

/** 로그인 직후 호출: 게스트 카트를 사용자 카트로 병합하고 쿠키 정리. */
export async function mergeGuestCartOnLogin(userId: string, authToken: string): Promise<void> {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) return;
  try {
    await cartClient.merge(guestId, userId, authToken);
  } finally {
    jar.delete(GUEST_COOKIE); // 병합 실패해도 무한 재시도 방지 (정책에 따라 조정)
  }
}
