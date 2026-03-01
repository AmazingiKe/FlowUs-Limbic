/**
 * TODO 表单模态框
 */

import { App, Modal, Setting } from 'obsidian';
import type { Todo } from '../entities/todo/schema';

export interface TodoFormData {
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
  description?: string;
}

export class TodoModal extends Modal {
  private formData: TodoFormData;
  private onSubmit: (data: TodoFormData) => void;
  private isEditing: boolean;

  constructor(
    app: App,
    todo: Partial<Todo> | null,
    onSubmit: (data: TodoFormData) => void
  ) {
    super(app);
    this.isEditing = !!todo;
    this.formData = {
      title: todo?.title || '',
      completed: todo?.completed ?? false,
      priority: todo?.priority,
      dueDate: todo?.dueDate,
      tags: todo?.tags || [],
      description: todo?.description
    };
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('flowus-todo-modal');

    contentEl.createEl('h2', {
      text: this.isEditing ? '编辑 TODO' : '新建 TODO'
    });

    // 标题
    new Setting(contentEl)
      .setName('标题')
      .setDesc('TODO 的标题')
      .addText(text => {
        text
          .setPlaceholder('输入标题')
          .setValue(this.formData.title)
          .onChange(value => {
            this.formData.title = value;
          });
      });

    // 完成状态
    new Setting(contentEl)
      .setName('已完成')
      .setDesc('标记为已完成')
      .addToggle(toggle => {
        toggle
          .setValue(this.formData.completed)
          .onChange(value => {
            this.formData.completed = value;
          });
      });

    // 优先级
    new Setting(contentEl)
      .setName('优先级')
      .setDesc('设置优先级')
      .addDropdown(dropdown => {
        dropdown
          .addOption('', '无')
          .addOption('low', '低')
          .addOption('medium', '中')
          .addOption('high', '高')
          .setValue(this.formData.priority || '')
          .onChange(value => {
            this.formData.priority = value ? (value as 'low' | 'medium' | 'high') : undefined;
          });
      });

    // 截止日期
    new Setting(contentEl)
      .setName('截止日期')
      .setDesc('设置截止日期')
      .addText(text => {
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.formData.dueDate || '')
          .onChange(value => {
            this.formData.dueDate = value || undefined;
          });
      });

    // 标签
    new Setting(contentEl)
      .setName('标签')
      .setDesc('用逗号分隔多个标签')
      .addText(text => {
        text
          .setPlaceholder('标签1, 标签2, 标签3')
          .setValue(this.formData.tags?.join(', ') || '')
          .onChange(value => {
            this.formData.tags = value
              ? value.split(',').map(t => t.trim()).filter(t => t)
              : [];
          });
      });

    // 描述
    new Setting(contentEl)
      .setName('描述')
      .setDesc('添加详细描述')
      .addTextarea(textarea => {
        textarea
          .setPlaceholder('输入描述...')
          .setValue(this.formData.description || '')
          .onChange(value => {
            this.formData.description = value || undefined;
          });
      });

    // 按钮
    const buttonContainer = contentEl.createDiv('flowus-todo-modal-buttons');

    const cancelBtn = buttonContainer.createEl('button', {
      cls: 'mod-cta',
      text: '取消'
    });
    cancelBtn.addEventListener('click', () => this.close());

    const submitBtn = buttonContainer.createEl('button', {
      cls: 'mod-cta',
      text: this.isEditing ? '保存' : '创建'
    });
    submitBtn.style.marginLeft = '8px';
    submitBtn.addEventListener('click', () => {
      if (!this.formData.title.trim()) {
        // TODO: 显示错误提示
        return;
      }
      this.onSubmit(this.formData);
      this.close();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
