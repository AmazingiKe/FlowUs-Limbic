import { ItemView, WorkspaceLeaf, Notice, MarkdownView } from 'obsidian';
import { TodoSyncManager } from './sync';
import { TodoItem } from '../flowus/api';

export const VIEW_TYPE_FLOWUS_TODO = 'flowus-todo-view';

export class TodoView extends ItemView {
  private syncManager: TodoSyncManager;
  private todoListEl: HTMLElement;
  private inputEl: HTMLInputElement;

  constructor(leaf: WorkspaceLeaf, syncManager: TodoSyncManager) {
    super(leaf);
    this.syncManager = syncManager;
  }

  getViewType(): string {
    return VIEW_TYPE_FLOWUS_TODO;
  }

  getDisplayText(): string {
    return 'FlowUs TODO';
  }

  async onOpen() {
    const containerEl = this.containerEl.children[1];
    containerEl.empty();
    
    // 创建标题
    containerEl.createEl('h1', { text: 'FlowUs TODO' });
    
    // 创建添加TODO的输入框
    const inputContainer = containerEl.createEl('div', { cls: 'todo-input-container' });
    this.inputEl = inputContainer.createEl('input', {
      type: 'text',
      placeholder: '添加新的TODO...',
      cls: 'todo-input'
    });
    
    // 添加按钮
    const addButton = inputContainer.createEl('button', {
      text: '添加',
      cls: 'todo-add-button'
    });
    
    // 绑定添加TODO的事件
    addButton.addEventListener('click', () => this.addTodo());
    this.inputEl.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        this.addTodo();
      }
    });
    
    // 创建TODO列表
    this.todoListEl = containerEl.createEl('div', { cls: 'todo-list' });
    
    // 加载TODO列表
    await this.loadTodos();
    
    // 添加样式
    this.addStyles();
  }

  async onClose() {
    // 视图关闭时的清理工作
  }

  /**
   * 添加TODO
   */
  private async addTodo() {
    const title = this.inputEl.value.trim();
    if (!title) return;
    
    try {
      await this.syncManager.addTodo(title);
      this.inputEl.value = '';
      await this.loadTodos();
      new Notice('TODO添加成功');
    } catch (error) {
      console.error('Failed to add todo:', error);
      new Notice('添加TODO失败，请检查网络连接');
    }
  }

  /**
   * 加载TODO列表
   */
  private async loadTodos() {
    try {
      const todos = await this.syncManager.getAllTodos();
      this.renderTodos(todos);
    } catch (error) {
      console.error('Failed to load todos:', error);
      this.todoListEl.createEl('div', {
        text: '加载TODO失败，请检查网络连接或授权状态',
        cls: 'todo-error'
      });
    }
  }

  /**
   * 渲染TODO列表
   */
  private renderTodos(todos: TodoItem[]) {
    this.todoListEl.empty();
    
    if (todos.length === 0) {
      this.todoListEl.createEl('div', {
        text: '暂无TODO项目',
        cls: 'todo-empty'
      });
      return;
    }
    
    // 按完成状态和创建时间排序
    todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // 渲染每个TODO项
    todos.forEach(todo => {
      const todoEl = this.todoListEl.createEl('div', { cls: 'todo-item' });
      
      // 创建复选框
      const checkbox = todoEl.createEl('input', {
        type: 'checkbox',
        cls: 'todo-checkbox'
      });
      checkbox.checked = todo.completed;
      
      // 创建标题
      const titleEl = todoEl.createEl('span', {
        text: todo.title,
        cls: 'todo-title'
      });
      if (todo.completed) {
        titleEl.addClass('todo-completed');
      }
      
      // 创建删除按钮
      const deleteButton = todoEl.createEl('button', {
        text: '删除',
        cls: 'todo-delete-button'
      });
      
      // 绑定事件
      checkbox.addEventListener('change', async () => {
        try {
          await this.syncManager.toggleTodo(todo.id);
          await this.loadTodos();
        } catch (error) {
          console.error('Failed to toggle todo:', error);
          new Notice('更新TODO失败');
        }
      });
      
      deleteButton.addEventListener('click', async () => {
        try {
          await this.syncManager.deleteTodo(todo.id);
          await this.loadTodos();
          new Notice('TODO删除成功');
        } catch (error) {
          console.error('Failed to delete todo:', error);
          new Notice('删除TODO失败');
        }
      });
    });
  }

  /**
   * 添加样式
   */
  private addStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .todo-input-container {
        display: flex;
        margin-bottom: 20px;
      }
      
      .todo-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px 0 0 4px;
        font-size: 16px;
      }
      
      .todo-add-button {
        padding: 10px 20px;
        background-color: #00796b;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
        font-size: 16px;
      }
      
      .todo-add-button:hover {
        background-color: #00695c;
      }
      
      .todo-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .todo-item {
        display: flex;
        align-items: center;
        padding: 10px;
        background-color: #f9f9f9;
        border-radius: 4px;
        gap: 10px;
      }
      
      .todo-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      
      .todo-title {
        flex: 1;
        font-size: 16px;
      }
      
      .todo-completed {
        text-decoration: line-through;
        color: #999;
      }
      
      .todo-delete-button {
        padding: 5px 10px;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .todo-delete-button:hover {
        background-color: #d32f2f;
      }
      
      .todo-empty {
        text-align: center;
        padding: 40px;
        color: #999;
        font-style: italic;
      }
      
      .todo-error {
        text-align: center;
        padding: 40px;
        color: #f44336;
      }
    `;
    
    this.containerEl.appendChild(styleEl);
  }


}