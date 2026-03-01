/**
 * FlowUs OAuth 管理器
 * 处理完整的 OAuth2 授权流程
 */

import { Notice } from 'obsidian';
import axios from 'axios';
import { OAuthCallbackServer } from './auth-server';
import type { FlowUsLimbicSettings } from '../settings';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class FlowUsOAuthManager {
  private readonly AUTH_URL = 'https://api.flowus.cn/oauth/authorize';
  private readonly TOKEN_URL = 'https://api.flowus.cn/oauth/token';

  private server: OAuthCallbackServer | null = null;

  constructor(
    private settings: FlowUsLimbicSettings,
    private onTokensUpdated: (tokens: Partial<FlowUsLimbicSettings>) => Promise<void>
  ) {}

  /**
   * 更新设置
   */
  updateSettings(settings: FlowUsLimbicSettings): void {
    this.settings = settings;
  }

  /**
   * 检查是否已授权
   */
  isAuthorized(): boolean {
    return !!this.settings.accessToken;
  }

  /**
   * 检查令牌是否过期
   */
  isTokenExpired(): boolean {
    if (!this.settings.tokenExpiry) return true;
    return Date.now() >= this.settings.tokenExpiry;
  }

  /**
   * 启动授权流程
   */
  async startAuthorization(): Promise<void> {
    console.log('=== startAuthorization called ===');
    console.log('Client ID:', this.settings.clientId ? '✓ set' : '✗ not set');
    console.log('Client Secret:', this.settings.clientSecret ? '✓ set' : '✗ not set');

    if (!this.settings.clientId || !this.settings.clientSecret) {
      new Notice('请先填写 Client ID 和 Client Secret');
      return;
    }

    // 如果已有正在进行的授权，先停止
    if (this.server) {
      console.log('Stopping existing server...');
      this.server.stop();
    }

    try {
      console.log('Creating OAuth callback server...');
      // 创建并启动回调服务器
      this.server = new OAuthCallbackServer({
        port: 3000,
        path: '/callback',
        timeout: 120000 // 2 分钟
      });

      const state = Math.random().toString(36).substring(2, 15);
      console.log('Generated state:', state);

      // 生成授权 URL
      const params = new URLSearchParams({
        client_id: this.settings.clientId,
        response_type: 'code',
        redirect_uri: 'http://localhost:3000/callback',
        scope: 'all',
        state: state
      });

      const authUrl = `${this.AUTH_URL}?${params.toString()}`;
      console.log('Opening auth URL:', authUrl);

      // 打开授权页面
      window.open(authUrl, '_blank');
      new Notice('已打开授权页面，请在浏览器中完成授权...');

      console.log('Waiting for authorization code...');
      // 等待授权码
      const code = await this.server.start();
      console.log('Received code:', code ? '✓ code received' : '✗ no code');
      new Notice('授权成功！正在获取令牌...');

      // 用授权码换取令牌
      console.log('Exchanging code for token...');
      await this.exchangeCodeForToken(code);

      new Notice('✅ FlowUs 授权成功！');
      console.log('=== Authorization complete ===');

    } catch (error) {
      console.error('OAuth authorization failed:', error);
      new Notice(`授权失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      console.log('Cleaning up server...');
      if (this.server) {
        this.server.stop();
        this.server = null;
      }
    }
  }

  /**
   * 用授权码换取令牌
   */
  private async exchangeCodeForToken(code: string): Promise<void> {
    console.log('Exchanging code for token...');
    console.log('Token URL:', this.TOKEN_URL);
    console.log('Client ID:', this.settings.clientId);

    try {
      const response = await axios.post<TokenResponse>(this.TOKEN_URL, {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        redirect_uri: 'http://localhost:3000/callback'
      });

      console.log('Token response received:', response.data);
      console.log('Full response:', JSON.stringify(response.data, null, 2));

      const tokens = response.data;
      console.log('tokens.access_token:', tokens.access_token);
      console.log('tokens.refresh_token:', tokens.refresh_token);
      console.log('tokens.expires_in:', tokens.expires_in);

      // 检查是否有嵌套的 data 字段
      const actualTokens = tokens.data || tokens;
      console.log('actualTokens:', actualTokens);

      // FlowUs 可能不返回 expires_in 和 refresh_token
      // 使用一个很长的过期时间（比如 1 年）
      const expiresIn = actualTokens.expires_in || (365 * 24 * 60 * 60); // 1 年
      const tokenExpiry = Date.now() + (expiresIn * 1000);

      console.log('Saving tokens...');
      console.log('Access token:', actualTokens.access_token ? '✓ has token' : '✗ no token');
      console.log('Refresh token:', actualTokens.refresh_token ? '✓ has refresh token' : '✗ no refresh token (using long expiry)');

      // 更新设置
      await this.onTokensUpdated({
        accessToken: actualTokens.access_token || '',
        refreshToken: actualTokens.refresh_token || '',
        tokenExpiry: tokenExpiry
      });

      console.log('Tokens saved successfully!');
      new Notice('✅ Token 已保存！');

    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<void> {
    if (!this.settings.refreshToken) {
      console.log('No refresh token available, skipping refresh (using long-lived token)');
      // FlowUs 可能不提供 refresh token，我们假设 access token 长期有效
      return;
    }

    try {
      const response = await axios.post<TokenResponse>(this.TOKEN_URL, {
        grant_type: 'refresh_token',
        refresh_token: this.settings.refreshToken,
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret
      });

      const tokens = response.data;
      const actualTokens = tokens.data || tokens;
      const expiresIn = actualTokens.expires_in || (365 * 24 * 60 * 60);
      const tokenExpiry = Date.now() + (expiresIn * 1000);

      await this.onTokensUpdated({
        accessToken: actualTokens.access_token,
        refreshToken: actualTokens.refresh_token || this.settings.refreshToken,
        tokenExpiry: tokenExpiry
      });

      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * 清除授权
   */
  async clearAuthorization(): Promise<void> {
    await this.onTokensUpdated({
      accessToken: '',
      refreshToken: '',
      tokenExpiry: 0
    });
  }
}
