/**
 * Mock HTTP 客户端
 * 职责: 模拟 HTTP 请求用于测试
 */

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class MockHttpClient {
  private responses = new Map<string, any>();
  private errors = new Map<string, Error>();
  private callHistory: Array<{ method: string; url: string; data?: any }> = [];

  // 设置 Mock 响应
  mockResponse(url: string, data: any): void {
    this.responses.set(url, data);
  }

  // 设置 Mock 错误
  mockError(url: string, error: Error): void {
    this.errors.set(url, error);
  }

  // 获取调用历史
  getCallHistory(): Array<{ method: string; url: string; data?: any }> {
    return this.callHistory;
  }

  // 清空历史
  clearHistory(): void {
    this.callHistory = [];
  }

  // 创建 Mock Axios 实例
  getInstance(): AxiosInstance {
    const self = this;

    return {
      get: async (url: string, config?: AxiosRequestConfig) => {
        self.callHistory.push({ method: 'GET', url });
        return self.handleRequest(url);
      },
      post: async (url: string, data?: any, config?: AxiosRequestConfig) => {
        self.callHistory.push({ method: 'POST', url, data });
        return self.handleRequest(url);
      },
      put: async (url: string, data?: any, config?: AxiosRequestConfig) => {
        self.callHistory.push({ method: 'PUT', url, data });
        return self.handleRequest(url);
      },
      delete: async (url: string, config?: AxiosRequestConfig) => {
        self.callHistory.push({ method: 'DELETE', url });
        return self.handleRequest(url);
      },
      patch: async (url: string, data?: any, config?: AxiosRequestConfig) => {
        self.callHistory.push({ method: 'PATCH', url, data });
        return self.handleRequest(url);
      }
    } as any;
  }

  private handleRequest(url: string): Promise<AxiosResponse> {
    if (this.errors.has(url)) {
      return Promise.reject(this.errors.get(url));
    }

    if (this.responses.has(url)) {
      return Promise.resolve({
        data: this.responses.get(url),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });
    }

    return Promise.reject(new Error(`No mock response for URL: ${url}`));
  }
}
