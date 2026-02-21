/**
 * FlowUs HTTP 客户端
 * 职责: 统一 HTTP 请求配置、拦截器、错误处理
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthManager } from '../auth/manager';
import { AuthenticationError, RateLimitError, NetworkError, ServerError } from '../errors';

export class FlowUsHttpClient {
  private client: AxiosInstance;

  constructor(
    private authManager: AuthManager,
    private baseURL = 'https://api.flowus.cn/v1'
  ) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'FlowUs-Version': '2024-01-01'
      }
    });

    this.setupInterceptors();
  }

  /**
   * 配置请求/响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器 - 注入 Token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.authManager.getAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 错误处理
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // 401 未授权 - 尝试刷新 Token
        if (error.response?.status === 401) {
          try {
            await this.authManager.refreshAccessToken();
            // 重试原请求
            return this.client.request(error.config!);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw new AuthenticationError('Authentication failed, please re-login');
          }
        }

        // 429 限流 - 等待后重试
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

          console.warn(`Rate limited, retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.client.request(error.config!);
        }

        // 5xx 服务器错误 - 重试 3 次
        if (error.response?.status && error.response.status >= 500) {
          const retryCount = (error.config as any).__retryCount || 0;
          if (retryCount < 3) {
            (error.config as any).__retryCount = retryCount + 1;
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.client.request(error.config!);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * 标准化错误格式
   */
  private normalizeError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as any;
      const status = error.response.status;
      const message = data?.message || `API Error: ${status} ${error.response.statusText}`;

      if (status === 401) {
        return new AuthenticationError(message);
      }

      if (status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
        return new RateLimitError(retryAfter);
      }

      if (status >= 500) {
        return new ServerError(message, status);
      }

      return new Error(message);
    }

    if (error.request) {
      return new NetworkError('Network error: No response from server');
    }

    return new Error(error.message || 'Unknown error');
  }

  /**
   * 获取 Axios 实例
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}
