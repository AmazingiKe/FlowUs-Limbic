/**
 * TODO 实体 Schema 定义
 */

import {
  IUniversalEntity,
  EntitySchema,
  TodoBlock,
  ParagraphBlock,
  RichTextContent
} from '@flowus-limbic/shared-types';
import { registry } from '../../universal/registry';

/**
 * TODO 实体接口
 */
export interface Todo extends IUniversalEntity {
  type: 'todo';
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
  description?: string;
}

/**
 * 辅助函数: 提取富文本内容
 */
function extractText(richText?: RichTextContent[]): string {
  if (!richText || richText.length === 0) return '';
  return richText.map(rt => rt.text?.content || '').join('');
}

/**
 * 辅助函数: 创建富文本内容
 */
function createRichText(content: string): RichTextContent[] {
  return [{ type: 'text', text: { content } }];
}

/**
 * TODO Schema 定义
 */
const todoSchema: EntitySchema<Todo> = {
  type: 'todo',
  displayName: '待办事项',
  description: 'GTD 任务管理',

  properties: [
    {
      name: 'Title',
      flowusType: 'title',
      required: true,
      mapTo: 'title'
    },
    {
      name: 'Completed',
      flowusType: 'checkbox',
      required: true,
      mapTo: 'completed',
      defaultValue: false
    },
    {
      name: 'Priority',
      flowusType: 'select',
      required: false,
      mapTo: 'priority',
      options: ['low', 'medium', 'high']
    },
    {
      name: 'Due Date',
      flowusType: 'date',
      required: false,
      mapTo: 'dueDate'
    },
    {
      name: 'Tags',
      flowusType: 'multi_select',
      required: false,
      mapTo: 'tags'
    }
  ],

  /**
   * Entity → Block[]
   */
  toBlocks: (todo: Todo): TodoBlock[] => {
    const blocks: TodoBlock[] = [
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: createRichText(todo.title),
          checked: todo.completed,
          color: 'default'
        }
      }
    ];

    // 添加描述 (作为子 Block)
    if (todo.description) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: createRichText(todo.description),
          checked: false,
          color: 'gray'
        }
      } as TodoBlock);
    }

    return blocks;
  },

  /**
   * Block[] → Entity
   */
  fromBlocks: (blocks: any[], metadata?: any): Todo => {
    const todoBlock = blocks.find(b => b.type === 'to_do');

    if (!todoBlock) {
      throw new Error('No to_do block found');
    }

    // 查找描述 Block (第二个 to_do block)
    const descBlocks = blocks.filter(b => b.type === 'to_do');
    const descBlock = descBlocks.length > 1 ? descBlocks[1] : null;

    return {
      id: metadata?.id || '',
      type: 'todo',
      title: extractText(todoBlock.to_do?.rich_text) || 'Untitled',
      completed: todoBlock.to_do?.checked || false,
      description: descBlock ? extractText(descBlock.to_do?.rich_text) : undefined,
      createdAt: metadata?.created_time || new Date().toISOString(),
      updatedAt: metadata?.last_edited_time || new Date().toISOString(),
      properties: {}
    } as Todo;
  },

  /**
   * 生成指纹 (用于变更检测)
   */
  getFingerprint: (todo: Todo): string => {
    return `${todo.title}:${todo.completed}:${todo.updatedAt}`;
  },

  /**
   * 验证实体
   */
  validate: (todo: Todo) => {
    const errors: string[] = [];

    if (!todo.title || todo.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (todo.priority && !['low', 'medium', 'high'].includes(todo.priority)) {
      errors.push('Invalid priority value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// 注册 Schema
registry.register(todoSchema);

export default todoSchema;
