import { App, Notice } from 'obsidian';
import { FlowUsAPI, TodoItem } from '../flowus/api';
import { FlowUsLimbicSettings } from '../main';

export class TodoSyncManager {
  private app: App;
  private api: FlowUsAPI;
  private settings: FlowUsLimbicSettings;
  private localTodos: Map<string, TodoItem> = new Map();
  private remoteTodos: Map<string, TodoItem> = new Map();
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30秒同步一次

  constructor(app: App, api: FlowUsAPI, settings: FlowUsLimbicSettings) {
    this.app = app;
    this.api = api;
    this.settings = settings;
  }

  /**
   * 更新API客户端
   */
  updateAPI(api: FlowUsAPI) {
    this.api = api;
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = window.setInterval(() => {
      this.sync();
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 执行同步操作
   */
  async sync(): Promise<void> {
    try {
      // 获取远程TODO
      const remoteTodos = await this.api.getTodos();
      this.remoteTodos = new Map(remoteTodos.map(todo => [todo.id, todo]));
      
      // 比较本地和远程TODO，执行同步
      await this.reconcileTodos();
      
      console.log('FlowUs TODO sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      new Notice('FlowUs TODO同步失败，请检查网络连接或授权状态');
    }
  }

  /**
   * 协调本地和远程TODO的差异
   */
  private async reconcileTodos(): Promise<void> {
    // 1. 找出需要创建的TODO（本地有，远程没有）
    for (const [id, localTodo] of this.localTodos) {
      if (!this.remoteTodos.has(id)) {
        try {
          await this.api.createTodo({
            title: localTodo.title,
            completed: localTodo.completed
          });
          console.log(`Created todo ${id} on FlowUs`);
        } catch (error) {
          console.error(`Failed to create todo ${id}:`, error);
        }
      }
    }

    // 2. 找出需要更新的TODO（两边都有，但内容不同）
    for (const [id, localTodo] of this.localTodos) {
      if (this.remoteTodos.has(id)) {
        const remoteTodo = this.remoteTodos.get(id)!;
        if (localTodo.title !== remoteTodo.title || localTodo.completed !== remoteTodo.completed) {
          try {
            await this.api.updateTodo(id, {
              title: localTodo.title,
              completed: localTodo.completed
            });
            console.log(`Updated todo ${id} on FlowUs`);
          } catch (error) {
            console.error(`Failed to update todo ${id}:`, error);
          }
        }
      }
    }

    // 3. 找出需要删除的TODO（远程有，本地没有）
    for (const [id, remoteTodo] of this.remoteTodos) {
      if (!this.localTodos.has(id)) {
        // 这里不自动删除本地TODO，而是更新本地状态以匹配远程
        this.localTodos.set(id, remoteTodo);
        console.log(`Added todo ${id} from FlowUs to local`);
      }
    }
  }

  /**
   * 获取所有TODO
   */
  async getAllTodos(): Promise<TodoItem[]> {
    // 如果本地没有数据，从远程获取
    if (this.localTodos.size === 0) {
      await this.sync();
    }
    return Array.from(this.localTodos.values());
  }

  /**
   * 添加TODO
   */
  async addTodo(title: string): Promise<TodoItem> {
    const newTodo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      completed: false
    };
    
    try {
      // 先在远程创建
      const createdTodo = await this.api.createTodo(newTodo);
      
      // 更新本地状态
      this.localTodos.set(createdTodo.id, createdTodo);
      
      return createdTodo;
    } catch (error) {
      console.error('Failed to add todo:', error);
      throw new Error('Failed to add todo');
    }
  }

  /**
   * 更新TODO
   */
  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<TodoItem> {
    try {
      // 先在远程更新
      const updatedTodo = await this.api.updateTodo(id, updates);
      
      // 更新本地状态
      this.localTodos.set(id, updatedTodo);
      
      return updatedTodo;
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw new Error('Failed to update todo');
    }
  }

  /**
   * 删除TODO
   */
  async deleteTodo(id: string): Promise<void> {
    try {
      // 先在远程删除
      await this.api.deleteTodo(id);
      
      // 更新本地状态
      this.localTodos.delete(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw new Error('Failed to delete todo');
    }
  }

  /**
   * 切换TODO完成状态
   */
  async toggleTodo(id: string): Promise<TodoItem> {
    const todo = this.localTodos.get(id);
    if (!todo) {
      throw new Error('Todo not found');
    }
    
    return this.updateTodo(id, {
      completed: !todo.completed
    });
  }
}