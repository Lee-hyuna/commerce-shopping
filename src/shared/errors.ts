// 도메인 전역 에러 모델. BFF 경계에서 HTTP 상태/메시지로 매핑된다.
export type AppErrorCode =
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'CART_NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'VALIDATION'
  | 'UNKNOWN';

const STATUS: Record<AppErrorCode, number> = {
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_UNAVAILABLE: 503,
  CART_NOT_FOUND: 404,
  OUT_OF_STOCK: 409,
  VALIDATION: 400,
  UNKNOWN: 500,
};

export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = STATUS[code];
  }
}

/** 사용자 노출용으로 정규화 (내부정보/PII 제거). */
export function toUserError(err: unknown): { code: AppErrorCode; message: string; status: number } {
  if (err instanceof AppError) return { code: err.code, message: err.message, status: err.status };
  return { code: 'UNKNOWN', message: '요청을 처리하지 못했습니다.', status: 500 };
}
