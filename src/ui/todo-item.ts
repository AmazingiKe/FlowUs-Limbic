/**
 * 单个 TODO 项组件
 */

import type { Todo } from '../entities/todo/schema';

export interface TodoItemCallbacks {
  onToggleComplete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export class TodoItemComponent {
  private container: HTMLElement;

  constructor(
    private todo: Todo,
    private callbacks: TodoItemCallbacks
  ) {
    this.container = document.createElement('div');
    this.container.addClass('flowus-todo-item');
    this.render();
  }

  get element(): HTMLElement {
    return this.container;
  }

  update(todo: Todo): void {
    this.todo = todo;
    this.render();
  }

  private render(): void {
    this.container.empty();

    // 主容器
    const mainRow = this.container.createDiv('flowus-todo-item-main');

    // 复选框
    const checkbox = mainRow.createEl('input', {
      type: 'checkbox',
      cls: 'flowus-todo-checkbox'
    });
    checkbox.checked = this.todo.completed;
    checkbox.addEventListener('change', () => {
      this.callbacks.onToggleComplete(this.todo);
    });

    // 标题
    const titleEl = mainRow.createDiv('flowus-todo-title');
    titleEl.setText(this.todo.title);
    if (this.todo.completed) {
      titleEl.addClass('flowus-todo-completed');
    }

    // 优先级标记
    if (this.todo.priority) {
      const priorityEl = mainRow.createSpan('flowus-todo-priority');
      priorityEl.setText(this.getPriorityLabel(this.todo.priority));
      priorityEl.addClass(`flowus-priority-${this.todo.priority}`);
    }

    // 操作按钮
    const actionsEl = mainRow.createDiv('flowus-todo-actions');

    // 编辑按钮
    const editBtn = actionsEl.createEl('button', {
      cls: 'flowus-todo-btn flowus-todo-btn-edit',
      text: '编辑'
    });
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onEdit(this.todo);
    });

    // 删除按钮
    const deleteBtn = actionsEl.createEl('button', {
      cls: 'flowus-todo-btn flowus-todo-btn-delete',
      text: '删除'
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('确定要删除这个 TODO 吗？')) {
        this.callbacks.onDelete(this.todo);
      }
    });

    // 描述（如果有）
    if (this.todo.description) {
      const descEl = this.container.createDiv('flowus-todo-description');
      descEl.setText(this.todo.description);
    }

    // 截止日期（如果有）
    if (this.todo.dueDate) {
      const dueDateEl = this.container.createDiv('flowus-todo-due-date');
      dueDateEl.setText(`截止: ${this.formatDate(this.todo.dueDate)}`);
    }

    // 标签（如果有）
    if (this.todo.tags && this.todo.tags.length > 0) {
      const tagsEl = this.container.createDiv('flowus-todo-tags');
      this.todo.tags.forEach(tag => {
        const tagEl = tagsEl.createSpan('flowus-todo-tag');
        tagEl.setText(tag);
      });
    }
  }

  private getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return labels[priority] || priority;
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  }
}
