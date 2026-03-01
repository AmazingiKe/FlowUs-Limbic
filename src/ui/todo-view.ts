/**
 * TODO 视图主组件
 */

import { ItemView, WorkspaceLeaf, Notice, addIcon } from 'obsidian';
import type FlowUsLimbicPlugin from '../main';
import type { Todo } from '../entities/todo/schema';
import { TodoListComponent, TodoListCallbacks } from './todo-list';
import { TodoModal, TodoFormData } from './todo-modal';
import { TodoService } from '../services/todo-service';
import type { FlowUsOAuthManager } from '../flowus/auth-manager';

export const TODO_VIEW_TYPE = 'flowus-limbic-todo-view';

// 自定义图标（更好看的待办事项图标）
const TODO_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 11l3 3L22 4"/>
  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
</svg>`;

addIcon('flowus-todo', TODO_ICON);

// 样式注入
const TODO_STYLES = `
/* FlowUs TODO 视图样式 */
.flowus-todo-view { padding: 16px; }
.flowus-todo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--background-modifier-border); }
.flowus-todo-header h2 { margin: 0; font-size: 1.5em; }
.flowus-todo-header-actions { display: flex; gap: 8px; }
.flowus-todo-status { margin-bottom: 16px; padding: 8px 12px; border-radius: 4px; font-size: 14px; }
.flowus-todo-status-warning { background-color: var(--background-modifier-warning); color: var(--text-warning); }
.flowus-todo-status-count { color: var(--text-muted); }
.flowus-todo-list-container { margin-top: 16px; }
.flowus-todo-list { display: flex; flex-direction: column; gap: 12px; }
.flowus-todo-item { padding: 12px; background-color: var(--background-secondary); border-radius: 8px; border: 1px solid var(--background-modifier-border); transition: background-color 0.2s ease; }
.flowus-todo-item:hover { background-color: var(--background-secondary-alt); }
.flowus-todo-item-main { display: flex; align-items: center; gap: 12px; }
.flowus-todo-checkbox { width: 18px; height: 18px; cursor: pointer; }
.flowus-todo-title { flex: 1; font-size: 16px; color: var(--text-normal); }
.flowus-todo-title.flowus-todo-completed { text-decoration: line-through; color: var(--text-muted); }
.flowus-todo-priority { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.flowus-priority-low { background-color: var(--background-modifier-success); color: var(--text-success); }
.flowus-priority-medium { background-color: var(--background-modifier-warning); color: var(--text-warning); }
.flowus-priority-high { background-color: var(--background-modifier-error); color: var(--text-error); }
.flowus-todo-actions { display: flex; gap: 8px; }
.flowus-todo-btn { padding: 4px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; border: none; transition: opacity 0.2s ease; }
.flowus-todo-btn:hover { opacity: 0.8; }
.flowus-todo-btn-edit { background-color: var(--interactive-normal); color: var(--text-normal); }
.flowus-todo-btn-delete { background-color: var(--background-modifier-error); color: var(--text-on-accent); }
.flowus-todo-description { margin-top: 8px; padding-left: 30px; font-size: 14px; color: var(--text-muted); }
.flowus-todo-due-date { margin-top: 4px; padding-left: 30px; font-size: 13px; color: var(--text-accent); }
.flowus-todo-tags { margin-top: 8px; padding-left: 30px; display: flex; gap: 6px; flex-wrap: wrap; }
.flowus-todo-tag { padding: 2px 8px; background-color: var(--interactive-normal); border-radius: 12px; font-size: 12px; color: var(--text-muted); }
.flowus-todo-loading, .flowus-todo-empty, .flowus-todo-error { padding: 24px; text-align: center; color: var(--text-muted); }
.flowus-todo-error { color: var(--text-error); }
.flowus-todo-modal { min-width: 400px; }
.flowus-todo-modal-buttons { display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--background-modifier-border); }
@media (max-width: 600px) {
  .flowus-todo-view { padding: 12px; }
  .flowus-todo-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .flowus-todo-item-main { flex-wrap: wrap; }
  .flowus-todo-actions { width: 100%; justify-content: flex-end; }
}
`;

// 样式管理
let styleElement: HTMLStyleElement | null = null;

function injectStyles(): void {
  if (styleElement) return;
  styleElement = document.createElement('style');
  styleElement.id = 'flowus-todo-styles';
  styleElement.textContent = TODO_STYLES;
  document.head.appendChild(styleElement);
}

function removeStyles(): void {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

export class TodoView extends ItemView {
  private todoService: TodoService;
  private todoListComponent: TodoListComponent;
  private todos: Todo[] = [];
  private loading: boolean = false;

  constructor(leaf: WorkspaceLeaf, private plugin: FlowUsLimbicPlugin, authManager?: FlowUsOAuthManager) {
    super(leaf);
    this.todoService = new TodoService(this.app, this.plugin.settings, authManager);
  }

  getViewType(): string {
    return TODO_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'FlowUs TODO';
  }

  getIcon(): string {
    return 'flowus-todo';
  }

  async onOpen(): Promise<void> {
    console.log('Opening TODO view');

    // 注入样式
    injectStyles();

    // 创建列表组件
    const listCallbacks: TodoListCallbacks = {
      onToggleComplete: this.handleToggleComplete.bind(this),
      onEdit: this.handleEditTodo.bind(this),
      onDelete: this.handleDeleteTodo.bind(this)
    };
    this.todoListComponent = new TodoListComponent(listCallbacks);

    // 渲染 UI
    this.render();

    // 加载数据
    await this.loadTodos();
  }

  async onClose(): Promise<void> {
    console.log('Closing TODO view');
    // 移除样式（如果没有其他视图使用）
    removeStyles();
  }

  updateSettings(): void {
    console.log('TodoView: updateSettings called');
    console.log('Has access token:', !!this.plugin.settings.accessToken);
    this.todoService.updateSettings(this.plugin.settings);
    // 更新设置后，重新加载数据
    this.loadTodos();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('flowus-todo-view');

    // 头部
    const header = contentEl.createDiv('flowus-todo-header');
    header.createEl('h2', { text: 'FlowUs TODO' });

    const headerActions = header.createDiv('flowus-todo-header-actions');

    // 同步按钮
    const syncBtn = headerActions.createEl('button', {
      cls: 'mod-cta',
      text: '同步'
    });
    syncBtn.addEventListener('click', () => this.handleSync());

    // 添加按钮
    const addBtn = headerActions.createEl('button', {
      cls: 'mod-cta',
      text: '添加 TODO'
    });
    addBtn.addEventListener('click', () => this.handleAddTodo());

    // 状态信息
    const statusEl = contentEl.createDiv('flowus-todo-status');
    this.updateStatus(statusEl);

    // 列表容器
    const listContainer = contentEl.createDiv('flowus-todo-list-container');
    listContainer.appendChild(this.todoListComponent.element);
  }

  private updateStatus(element: HTMLElement): void {
    element.empty();

    if (!this.todoService.isAuthorized()) {
      const warningEl = element.createDiv('flowus-todo-status-warning');
      warningEl.setText('⚠️ 未授权 FlowUs，请先在设置中授权');
      return;
    }

    const countEl = element.createDiv('flowus-todo-status-count');
    const completedCount = this.todos.filter(t => t.completed).length;
    countEl.setText(`共 ${this.todos.length} 项，已完成 ${completedCount} 项`);
  }

  private async loadTodos(): Promise<void> {
    console.log('loadTodos called');
    console.log('Todo service authorized:', this.todoService.isAuthorized());

    if (!this.todoService.isAuthorized()) {
      console.log('Not authorized, showing empty');
      this.todos = [];
      this.todoListComponent.setTodos(this.todos);
      this.updateStatusInView();
      return;
    }

    this.loading = true;
    this.todoListComponent.showLoading();

    try {
      console.log('Fetching todos...');
      this.todos = await this.todoService.getTodos();
      console.log('Fetched todos:', this.todos.length);
      this.todoListComponent.setTodos(this.todos);
    } catch (error) {
      console.error('Failed to load todos:', error);
      this.todoListComponent.showError(error instanceof Error ? error.message : '加载失败');
      new Notice('加载 TODO 失败');
    } finally {
      this.loading = false;
      this.updateStatusInView();
    }
  }

  private updateStatusInView(): void {
    const statusEl = this.contentEl.querySelector('.flowus-todo-status');
    if (statusEl) {
      this.updateStatus(statusEl as HTMLElement);
    }
  }

  private async handleSync(): Promise<void> {
    if (!this.todoService.isAuthorized()) {
      new Notice('请先授权 FlowUs');
      return;
    }

    try {
      await this.todoService.sync();
      await this.loadTodos();
    } catch (error) {
      console.error('Sync failed:', error);
      new Notice('同步失败');
    }
  }

  private handleAddTodo(): void {
    if (!this.todoService.isAuthorized()) {
      new Notice('请先授权 FlowUs');
      return;
    }

    const modal = new TodoModal(this.app, null, async (data) => {
      try {
        const newTodo = await this.todoService.createTodo(data);
        this.todos.push(newTodo);
        this.todoListComponent.setTodos(this.todos);
        this.updateStatusInView();
      } catch (error) {
        console.error('Failed to create todo:', error);
        new Notice('创建 TODO 失败');
      }
    });
    modal.open();
  }

  private async handleToggleComplete(todo: Todo): Promise<void> {
    try {
      const updatedTodo = await this.todoService.updateTodo(todo.id, {
        completed: !todo.completed
      });

      const index = this.todos.findIndex(t => t.id === todo.id);
      if (index !== -1) {
        this.todos[index] = { ...this.todos[index], completed: !todo.completed };
        this.todoListComponent.setTodos(this.todos);
        this.updateStatusInView();
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      new Notice('更新 TODO 失败');
    }
  }

  private handleEditTodo(todo: Todo): void {
    const modal = new TodoModal(this.app, todo, async (data) => {
      try {
        const updatedTodo = await this.todoService.updateTodo(todo.id, data);

        const index = this.todos.findIndex(t => t.id === todo.id);
        if (index !== -1) {
          this.todos[index] = { ...this.todos[index], ...data };
          this.todoListComponent.setTodos(this.todos);
        }
      } catch (error) {
        console.error('Failed to update todo:', error);
        new Notice('更新 TODO 失败');
      }
    });
    modal.open();
  }

  private async handleDeleteTodo(todo: Todo): Promise<void> {
    try {
      await this.todoService.deleteTodo(todo.id);
      this.todos = this.todos.filter(t => t.id !== todo.id);
      this.todoListComponent.setTodos(this.todos);
      this.updateStatusInView();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      new Notice('删除 TODO 失败');
    }
  }
}
