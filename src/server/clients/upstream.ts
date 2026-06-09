import 'server-only';
import ky, { HTTPError, TimeoutError } from 'ky';
import { AppError } from '@/shared/errors';

// downstream 마이크로서비스 공용 ky 인스턴스.
// 타임아웃 + idempotent 재시도 + 에러 정규화(beforeError hook).
export const upstream = ky.create({
  timeout: 2000,
  retry: { limit: 2, methods: ['get'] }, // GET만 재시도
  hooks: {
    beforeError: [
      (error) => {
        // ky 에러 → AppError 로 변환은 호출부(callUpstream)에서 수행.
        return error;
      },
    ],
  },
});

/** ky 호출을 AppError로 정규화. 서비스명/인증 토큰을 함께 처리. */
export async function callUpstream<T>(
  service: string,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (err) {
    if (err instanceof TimeoutError) {
      throw new AppError('UPSTREAM_TIMEOUT', `[${service}] timeout`, err);
    }
    if (err instanceof HTTPError) {
      const status = err.response.status;
      const code = status === 404 ? 'CART_NOT_FOUND' : status >= 500 ? 'UPSTREAM_UNAVAILABLE' : 'VALIDATION';
      throw new AppError(code, `[${service}] ${status}`, err);
    }
    throw new AppError('UPSTREAM_UNAVAILABLE', `[${service}] failed`, err);
  }
}

export const baseUrl = (env: string, fallback: string) => process.env[env] ?? fallback;

export function authHeaders(token?: string): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}
