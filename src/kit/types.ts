/**
 * Kit Tools 核心类型定义
 */

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface FlowUsConfig {
  baseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  databaseId?: string;
  tableName?: string;
}

/**
 * IStorageAdapter - 存储适配器接口
 * 职责: 隔离不同环境（Node.js/Obsidian）的持久化逻辑
 */
export interface IStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
