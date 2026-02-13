/**
 * FlowUs API 错误类型定义
 */

/**
 * FlowUs API 基础错误
 */
export class FlowUsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'FlowUsApiError';
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends FlowUsApiError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 限流错误
 */
export class RateLimitError extends FlowUsApiError {
  constructor(public retryAfter: number) {
    super(`Rate limit exceeded, retry after ${retryAfter}s`, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends FlowUsApiError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * 服务器错误
 */
export class ServerError extends FlowUsApiError {
  constructor(message: string, status: number) {
    super(message, 'SERVER_ERROR', status);
    this.name = 'ServerError';
  }
}
