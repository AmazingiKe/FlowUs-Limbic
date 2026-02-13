import axios, { AxiosInstance } from 'axios';
import { FlowUsConfig, IStorageAdapter, TodoItem } from '../types';

/**
 * FlowUsClient - 核心 SDK 客户端
 * 职责: 处理 API 请求与身份验证适配
 * 场景: 环境无关，通过注入 Storage 实现 Token 持久化
 */
export class FlowUsClient {
  private client: AxiosInstance;
  private readonly BASE_URL: string;

  constructor(
    private config: FlowUsConfig,
    private storage: IStorageAdapter
  ) {
    this.BASE_URL = config.baseUrl || 'https://api.flowus.cn/v1';

    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(async (config) => {
      // 从适配器获取最新 Token
      const token = await this.storage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * 获取数据库记录
   */
  async fetchPages(databaseId: string, filter?: any): Promise<any[]> {
    const response = await this.client.get('/pages', {
      params: {
        database_id: databaseId,
        ...filter
      }
    });
    return response.data.items || [];
  }

  /**
   * 创建页面/块
   */
  async createBlock(databaseId: string, properties: any): Promise<any> {
    const response = await this.client.post('/blocks', {
      parent_id: databaseId,
      properties
    });
    return response.data;
  }

  /**
   * 更新块属性
   */
  async updateBlock(blockId: string, properties: any): Promise<any> {
    const response = await this.client.patch(`/blocks/${blockId}`, {
      properties
    });
    return response.data;
  }

  /**
   * 删除块
   */
  async deleteBlock(blockId: string): Promise<void> {
    await this.client.delete(`/blocks/${blockId}`);
  }
}
