import { TodoItem } from '../types';

/**
 * TodoTransformer - 数据转换器
 * 职责: 处理 FlowUs 原始数据与插件标准格式的互转
 * 场景: 解耦 API 响应结构与业务逻辑
 */
export class TodoTransformer {
  /**
   * 将 FlowUs Page/Block 转换为 TodoItem
   */
  static fromFlowUs(raw: any): TodoItem {
    return {
      id: raw.id,
      title: raw.properties?.title?.title?.[0]?.text?.content || 'Untitled',
      completed: raw.properties?.completed?.checkbox || false,
      createdAt: raw.created_time,
      updatedAt: raw.last_edited_time,
      _raw: raw // 保留原始引用以便回溯
    };
  }

  /**
   * 将 TodoItem 转换为 FlowUs 属性包
   */
  static toFlowUs(todo: Partial<TodoItem>): any {
    const properties: any = {};

    if (todo.title !== undefined) {
      properties.title = {
        type: 'title',
        title: [{ text: { content: todo.title } }]
      };
    }

    if (todo.completed !== undefined) {
      properties.completed = {
        type: 'checkbox',
        checkbox: todo.completed
      };
    }

    return properties;
  }
}
