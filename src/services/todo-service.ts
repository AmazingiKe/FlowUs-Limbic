/**
 * TODO 业务逻辑服务
 * 封装与 FlowUs 适配器的交互，提供 TODO 的 CRUD 方法
 */

import { App, Notice } from 'obsidian';
import type { Todo } from '../entities/todo/schema';
import type { FlowUsLimbicSettings } from '../settings';
import type { FlowUsOAuthManager } from '../flowus/auth-manager';

export class TodoService {
  private settings: FlowUsLimbicSettings;

  constructor(
    private app: App,
    settings: FlowUsLimbicSettings,
    private authManager?: FlowUsOAuthManager
  ) {
    this.settings = settings;
  }

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
   * 获取 TODO 列表（模拟数据，实际需要调用 FlowUs API）
   */
  async getTodos(): Promise<Todo[]> {
    if (!this.isAuthorized()) {
      new Notice('请先授权 FlowUs');
      return [];
    }

    // TODO: 实际实现需要调用 FlowUs API
    // 这里先返回模拟数据
    console.log('Fetching todos from FlowUs...');

    return [
      {
        id: '1',
        type: 'todo',
        title: '完成 FlowUs 集成',
        completed: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        properties: {}
      },
      {
        id: '2',
        type: 'todo',
        title: '使用 localhost:3000 授权',
        completed: false,
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
        properties: {}
      },
      {
        id: '3',
        type: 'todo',
        title: '测试同步功能',
        completed: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        properties: {}
      }
    ];
  }

  /**
   * 创建新 TODO
   */
  async createTodo(todo: Omit<Todo, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'properties'>): Promise<Todo> {
    if (!this.isAuthorized()) {
      throw new Error('请先授权 FlowUs');
    }

    // TODO: 实际实现需要调用 FlowUs API
    console.log('Creating todo:', todo);

    const newTodo: Todo = {
      id: Date.now().toString(),
      type: 'todo',
      title: todo.title,
      completed: todo.completed ?? false,
      priority: todo.priority,
      dueDate: todo.dueDate,
      tags: todo.tags,
      description: todo.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      properties: {}
    };

    new Notice('TODO 已创建');
    return newTodo;
  }

  /**
   * 更新 TODO
   */
  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    if (!this.isAuthorized()) {
      throw new Error('请先授权 FlowUs');
    }

    // TODO: 实际实现需要调用 FlowUs API
    console.log('Updating todo:', id, updates);

    const updatedTodo: Todo = {
      id,
      type: 'todo',
      title: updates.title ?? 'Untitled',
      completed: updates.completed ?? false,
      priority: updates.priority,
      dueDate: updates.dueDate,
      tags: updates.tags,
      description: updates.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      properties: {}
    };

    new Notice('TODO 已更新');
    return updatedTodo;
  }

  /**
   * 删除 TODO
   */
  async deleteTodo(id: string): Promise<void> {
    if (!this.isAuthorized()) {
      throw new Error('请先授权 FlowUs');
    }

    // TODO: 实际实现需要调用 FlowUs API
    console.log('Deleting todo:', id);
    new Notice('TODO 已删除');
  }

  /**
   * 同步 TODO
   */
  async sync(): Promise<void> {
    if (!this.isAuthorized()) {
      throw new Error('请先授权 FlowUs');
    }

    // 检查令牌是否需要刷新（只有在有 refresh token 的时候才刷新）
    if (this.authManager && this.authManager.isTokenExpired()) {
      try {
        new Notice('正在刷新令牌...');
        await this.authManager.refreshToken();
        new Notice('令牌刷新成功');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // 不抛出错误，继续尝试同步
      }
    }

    // TODO: 实际实现需要调用同步引擎
    console.log('Syncing todos...');
    new Notice('同步中...');

    // 模拟同步延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    new Notice('同步完成');
  }
}
