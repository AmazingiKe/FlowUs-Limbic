/**
 * 测试数据工厂
 * 职责: 生成测试用的实体和 Schema
 */

import { IUniversalEntity, EntitySchema, ValidationResult } from '@flowus-limbic/shared-types';

export interface TestEntity extends IUniversalEntity {
  type: 'test';
  properties: {
    title: string;
    description?: string;
    status?: string;
  };
}

export const createTestEntity = (overrides?: Partial<TestEntity>): TestEntity => {
  const now = new Date().toISOString();
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    type: 'test',
    createdAt: now,
    updatedAt: now,
    properties: {
      title: 'Test Entity',
      description: 'Test description',
      status: 'active'
    },
    ...overrides
  };
};

export const createTestSchema = (): EntitySchema<TestEntity> => {
  return {
    type: 'test',
    displayName: 'Test Entity',
    description: 'Test entity schema',
    properties: [
      {
        name: 'Title',
        flowusType: 'title',
        required: true,
        mapTo: 'properties.title'
      },
      {
        name: 'Description',
        flowusType: 'rich_text',
        required: false,
        mapTo: 'properties.description'
      },
      {
        name: 'Status',
        flowusType: 'select',
        required: false,
        mapTo: 'properties.status',
        options: ['active', 'inactive', 'archived']
      }
    ],
    toBlocks: (entity: TestEntity) => {
      return [
        {
          type: 'page',
          properties: {
            title: { title: [{ text: { content: entity.properties.title } }] },
            description: { rich_text: [{ text: { content: entity.properties.description || '' } }] },
            status: { select: { name: entity.properties.status || 'active' } }
          }
        }
      ];
    },
    fromBlocks: (blocks: any[], metadata?: any): TestEntity => {
      const block = blocks[0];
      return {
        id: metadata?.id || `test-${Date.now()}`,
        type: 'test',
        createdAt: metadata?.createdAt || new Date().toISOString(),
        updatedAt: metadata?.updatedAt || new Date().toISOString(),
        properties: {
          title: block.properties.title?.title?.[0]?.text?.content || '',
          description: block.properties.description?.rich_text?.[0]?.text?.content,
          status: block.properties.status?.select?.name
        }
      };
    },
    getFingerprint: (entity: TestEntity) => {
      return JSON.stringify({
        title: entity.properties.title,
        description: entity.properties.description,
        status: entity.properties.status
      });
    },
    validate: (entity: TestEntity): ValidationResult => {
      const errors: string[] = [];

      if (!entity.properties.title || entity.properties.title.trim() === '') {
        errors.push('Title is required');
      }

      if (entity.properties.status && !['active', 'inactive', 'archived'].includes(entity.properties.status)) {
        errors.push('Invalid status value');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    }
  };
};
