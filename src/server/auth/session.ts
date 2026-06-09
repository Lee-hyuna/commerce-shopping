import 'server-only';

export interface Session {
  userId: string;
  cartId: string;
  accessToken: string;
}

// TODO: 실제 인증 연동(세션 쿠키/JWT 검증). 현재는 자리표시자.
export async function getSession(): Promise<Session | null> {
  return null;
}
