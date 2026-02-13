import axios from 'axios';
import { AuthConfig, StorageAdapter, TokenResponse } from './types';

/**
 * @class Authenticator
 * @description 处理 OAuth 2.0 授权逻辑，独立于具体环境
 */
export class Authenticator {
  private readonly TOKEN_URL = 'https://api.flowus.cn/oauth/token';
  private readonly AUTH_URL = 'https://api.flowus.cn/oauth/authorize';

  constructor(
    private config: AuthConfig,
    private storage: StorageAdapter
  ) {}

  /**
   * 生成授权 URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'all',
      state: state || Math.random().toString(36).substring(2, 15)
    });
    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * 使用授权码交换令牌
   */
  async exchangeCode(code: string): Promise<TokenResponse> {
    const response = await axios.post(this.TOKEN_URL, {
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri
    });

    await this.saveTokens(response.data);
    return response.data;
  }

  /**
   * 刷新令牌
   */
  async refresh(): Promise<TokenResponse> {
    const refreshToken = await this.storage.getItem('flowus_refresh_token');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await axios.post(this.TOKEN_URL, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    await this.saveTokens(response.data);
    return response.data;
  }

  /**
   * 检查令牌是否过期
   */
  async isTokenExpired(): Promise<boolean> {
    const expiry = await this.storage.getItem('flowus_token_expiry');
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry, 10);
  }

  /**
   * 持久化令牌信息
   */
  private async saveTokens(data: TokenResponse): Promise<void> {
    const expiry = Date.now() + (data.expires_in * 1000);
    await Promise.all([
      this.storage.setItem('flowus_access_token', data.access_token),
      this.storage.setItem('flowus_refresh_token', data.refresh_token),
      this.storage.setItem('flowus_token_expiry', expiry.toString())
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return this.storage.getItem('flowus_access_token');
  }
}
