/**
 * FlowUs 适配器
 * 职责: 组装所有客户端，提供统一入口
 */

import { IStorageAdapter, AuthConfig } from '@flowus-limbic/shared-types';
import { FlowUsHttpClient } from './api/http-client';
import { FlowUsBlockClient } from './api/block-client';
import { FlowUsPageClient } from './api/page-client';
import { FlowUsDatabaseClient } from './api/database-client';
import { AuthManager } from './auth/manager';

export class FlowUsAdapter {
  public readonly block: FlowUsBlockClient;
  public readonly page: FlowUsPageClient;
  public readonly database: FlowUsDatabaseClient;
  public readonly auth: AuthManager;

  constructor(
    storage: IStorageAdapter,
    config: AuthConfig
  ) {
    // 初始化认证管理器
    this.auth = new AuthManager(storage, config);

    // 初始化 HTTP 客户端
    const httpClient = new FlowUsHttpClient(this.auth);
    const axiosInstance = httpClient.getInstance();

    // 初始化各个 API 客户端
    this.block = new FlowUsBlockClient(axiosInstance);
    this.page = new FlowUsPageClient(axiosInstance);
    this.database = new FlowUsDatabaseClient(axiosInstance);
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    await this.auth.initialize();
  }
}
