import axios from 'axios';
import type { FlowUsLimbicSettings } from '../settings';

export class FlowUsOAuth {
  private settings: FlowUsLimbicSettings;
  private readonly TOKEN_URL = 'https://api.flowus.cn/oauth/token';
  private readonly AUTH_URL = 'https://api.flowus.cn/oauth/authorize';

  constructor(settings: FlowUsLimbicSettings) {
    this.settings = settings;
  }

  /**
   * 获取授权URL
   */
  getAuthorizationUrl(): string {
    // 使用本地Obsidian URI作为重定向地址
    const redirectUri = 'obsidian://flowus-limbic-callback';
    
    const params = new URLSearchParams({
      client_id: this.settings.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'all',
      state: Math.random().toString(36).substring(2, 15)
    });
    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * 使用授权码交换访问令牌
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      // 使用与授权URL中相同的重定向地址
      const redirectUri = 'obsidian://flowus-limbic-callback';
      
      const response = await axios.post(this.TOKEN_URL, {
        grant_type: 'authorization_code',
        code,
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        redirect_uri: redirectUri
      });
      return response.data;
    } catch (error) {
      console.error('FlowUs OAuth token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * 使用刷新令牌获取新的访问令牌
   */
  async refreshAccessToken(): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    if (!this.settings.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(this.TOKEN_URL, {
        grant_type: 'refresh_token',
        refresh_token: this.settings.refreshToken,
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret
      });
      return response.data;
    } catch (error) {
      console.error('FlowUs OAuth token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * 检查令牌是否过期
   */
  isTokenExpired(): boolean {
    const expiry = this.settings.tokenExpiry;
    if (!expiry) return true;
    return Date.now() >= expiry;
  }

  /**
   * 计算令牌过期时间
   */
  calculateExpiry(expiresIn: number): number {
    return Date.now() + (expiresIn * 1000);
  }
}