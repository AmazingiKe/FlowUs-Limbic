/**
 * TODO 列表组件
 */

import type { Todo } from '../entities/todo/schema';
import { TodoItemComponent, TodoItemCallbacks } from './todo-item';

export interface TodoListCallbacks {
  onToggleComplete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export class TodoListComponent {
  private container: HTMLElement;
  private todoItems: Map<string, TodoItemComponent> = new Map();
  private todos: Todo[] = [];

  constructor(private callbacks: TodoListCallbacks) {
    this.container = document.createElement('div');
    this.container.addClass('flowus-todo-list');
  }

  get element(): HTMLElement {
    return this.container;
  }

  setTodos(todos: Todo[]): void {
    this.todos = todos;
    this.render();
  }

  showLoading(): void {
    this.container.empty();
    const loadingEl = this.container.createDiv('flowus-todo-loading');
    loadingEl.setText('加载中...');
  }

  showEmpty(): void {
    this.container.empty();
    const emptyEl = this.container.createDiv('flowus-todo-empty');
    emptyEl.setText('暂无 TODO');
  }

  showError(message: string): void {
    this.container.empty();
    const errorEl = this.container.createDiv('flowus-todo-error');
    errorEl.setText(`错误: ${message}`);
  }

  private render(): void {
    this.container.empty();
    this.todoItems.clear();

    if (this.todos.length === 0) {
      this.showEmpty();
      return;
    }

    // 按完成状态排序（未完成的在前）
    const sortedTodos = [...this.todos].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    sortedTodos.forEach(todo => {
      const itemCallbacks: TodoItemCallbacks = {
        onToggleComplete: this.callbacks.onToggleComplete,
        onEdit: this.callbacks.onEdit,
        onDelete: this.callbacks.onDelete
      };

      const itemComponent = new TodoItemComponent(todo, itemCallbacks);
      this.todoItems.set(todo.id, itemComponent);
      this.container.appendChild(itemComponent.element);
    });
  }
}
