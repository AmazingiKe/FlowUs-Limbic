import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { FlowUsLimbicSettings } from '../settings';
import { FlowUsOAuth } from './oauth';

// TODO项目接口
export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class FlowUsAPI {
  private settings: FlowUsLimbicSettings;
  private oauth: FlowUsOAuth;
  private client: AxiosInstance;
  private readonly BASE_URL = 'https://api.flowus.cn/v1';

  constructor(settings: FlowUsLimbicSettings, oauth: FlowUsOAuth) {
    this.settings = settings;
    this.oauth = oauth;
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 添加请求拦截器，自动处理令牌
    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      // 检查令牌是否过期
      if (this.oauth.isTokenExpired()) {
        try {
          // 刷新令牌
          const tokenResponse = await this.oauth.refreshAccessToken();
          const expiry = this.oauth.calculateExpiry(tokenResponse.expires_in);
          
          // 更新设置
          this.settings.accessToken = tokenResponse.access_token;
          this.settings.refreshToken = tokenResponse.refresh_token;
          this.settings.tokenExpiry = expiry;
        } catch (error) {
          console.error('Token refresh failed:', error);
          throw new Error('Authentication failed');
        }
      }
      
      // 添加认证头
      if (this.settings.accessToken) {
        config.headers.Authorization = `Bearer ${this.settings.accessToken}`;
      }
      
      return config;
    });
  }

  /**
   * 获取FlowUs数据库中的TODO项目
   */
  async getTodos(): Promise<TodoItem[]> {
    try {
      // 根据FlowUs API文档，我们需要获取数据库中的记录
      const response = await this.client.get(`/pages`, {
        params: {
          database_id: this.settings.databaseId,
          filter: {
            table_name: this.settings.tableName
          }
        }
      });
      
      // 转换响应数据为TodoItem格式
      return response.data.items.map((item: any) => ({
        id: item.id,
        title: item.properties.title.title[0].text.content,
        completed: item.properties.completed?.checkbox || false,
        createdAt: item.created_time,
        updatedAt: item.last_edited_time,
        ...item
      }));
    } catch (error) {
      console.error('Failed to get todos:', error);
      throw new Error('Failed to retrieve todos from FlowUs');
    }
  }

  /**
   * 创建新的TODO项目
   */
  async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    try {
      const response = await this.client.post('/pages', {
        parent: { database_id: this.settings.databaseId },
        properties: {
          title: {
            type: 'title',
            title: [{ text: { content: todo.title } }]
          },
          completed: {
            type: 'checkbox',
            checkbox: todo.completed
          },
          ...todo
        }
      });
      
      return {
        id: response.data.id,
        title: response.data.properties.title.title[0].text.content,
        completed: response.data.properties.completed?.checkbox || false,
        createdAt: response.data.created_time,
        updatedAt: response.data.last_edited_time,
        ...response.data
      };
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw new Error('Failed to create todo in FlowUs');
    }
  }

  /**
   * 更新TODO项目
   */
  async updateTodo(id: string, todo: Partial<TodoItem>): Promise<TodoItem> {
    try {
      const updateData: any = {};
      
      if (todo.title !== undefined) {
        updateData.title = {
          type: 'title',
          title: [{ text: { content: todo.title } }]
        };
      }
      
      if (todo.completed !== undefined) {
        updateData.completed = {
          type: 'checkbox',
          checkbox: todo.completed
        };
      }
      
      // 添加其他字段
      Object.keys(todo).forEach(key => {
        if (!['id', 'title', 'completed', 'createdAt', 'updatedAt'].includes(key)) {
          updateData[key] = todo[key];
        }
      });
      
      const response = await this.client.patch(`/blocks/${id}`, {
        properties: updateData
      });
      
      return {
        id: response.data.id,
        title: response.data.properties.title.title[0].text.content,
        completed: response.data.properties.completed?.checkbox || false,
        createdAt: response.data.created_time,
        updatedAt: response.data.last_edited_time,
        ...response.data
      };
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw new Error('Failed to update todo in FlowUs');
    }
  }

  /**
   * 删除TODO项目
   */
  async deleteTodo(id: string): Promise<void> {
    try {
      await this.client.delete(`/blocks/${id}`);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw new Error('Failed to delete todo from FlowUs');
    }
  }
}