/**
 * @interface StorageAdapter
 * @description 存储适配器接口，用于抹平 Obsidian 和 CLI 的存储差异
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * @interface AuthConfig
 * @description 身份验证配置
 */
export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * @interface TokenResponse
 * @description API 返回的令牌结构
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * @interface TodoItem
 * @description 核心 TODO 数据结构
 */
export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * @interface Database
 * @description FlowUs 数据库类型
 */
export interface Database {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  cover?: string;
  createdTime: number;
  updatedTime: number;
}

export interface DatabaseListResponse {
  items: Database[];
  total: number;
  page: number;
  pageSize: number;
}
