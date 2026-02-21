/**
 * FlowUs 认证管理器
 * 职责: 管理 OAuth Token 的获取、刷新和存储
 */

import { IStorageAdapter, TokenInfo, AuthConfig } from '@flowus-limbic/shared-types';
import { AuthenticationError } from '../errors';

export class AuthManager {
  private tokenInfo: TokenInfo | null = null;

  constructor(
    private storage: IStorageAdapter,
    private config: AuthConfig
  ) {}

  /**
   * 初始化 - 从存储加载 Token
   */
  async initialize(): Promise<void> {
    const stored = await this.storage.get<TokenInfo>('flowus_token');
    if (stored) {
      this.tokenInfo = stored;
    }
  }

  /**
   * 获取授权 URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'all',
      state: state || Math.random().toString(36).substring(2)
    });

    return `https://api.flowus.cn/oauth/authorize?${params.toString()}`;
  }

  /**
   * 使用授权码换取 Token
   */
  async exchangeCode(code: string): Promise<TokenInfo> {
    const response = await fetch('https://api.flowus.cn/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthenticationError(`Token exchange failed: ${errorText}`);
    }

    const data = await response.json();
    this.tokenInfo = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };

    await this.storage.set('flowus_token', this.tokenInfo);
    return this.tokenInfo;
  }

  /**
   * 刷新 Token
   */
  async refreshAccessToken(): Promise<TokenInfo> {
    if (!this.tokenInfo?.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    const response = await fetch('https://api.flowus.cn/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokenInfo.refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthenticationError(`Token refresh failed: ${errorText}`);
    }

    const data = await response.json();
    this.tokenInfo = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };

    await this.storage.set('flowus_token', this.tokenInfo);
    return this.tokenInfo;
  }

  /**
   * 获取当前有效的 Access Token
   */
  async getAccessToken(): Promise<string> {
    if (!this.tokenInfo) {
      throw new AuthenticationError('Not authenticated');
    }

    // Token 即将过期 (提前 5 分钟刷新)
    if (Date.now() + 5 * 60 * 1000 >= this.tokenInfo.expiresAt) {
      await this.refreshAccessToken();
    }

    return this.tokenInfo.accessToken;
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.tokenInfo !== null;
  }

  /**
   * 清除认证信息
   */
  async logout(): Promise<void> {
    this.tokenInfo = null;
    await this.storage.remove('flowus_token');
  }
}
