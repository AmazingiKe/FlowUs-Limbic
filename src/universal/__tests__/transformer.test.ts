/**
 * Transformer 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TransformerEngine, TransformMiddleware } from '../transformer';
import { EntityRegistry } from '../registry';
import { createTestEntity, createTestSchema, TestEntity } from '../../__tests__/mocks/test-data';

describe('TransformerEngine', () => {
  let registry: EntityRegistry;
  let transformer: TransformerEngine;

  beforeEach(() => {
    registry = new EntityRegistry();
    registry.register(createTestSchema());
    transformer = new TransformerEngine(registry);
  });

  describe('Entity → Blocks 转换', () => {
    it('应该成功将 Entity 转换为 Blocks', async () => {
      const entity = createTestEntity({
        properties: {
          title: 'Test Title',
          description: 'Test Description',
          status: 'active'
        }
      });

      const blocks = await transformer.toBlocks(entity);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('page');
      expect(blocks[0].properties.title.title[0].text.content).toBe('Test Title');
    });

    it('应该在转换未注册类型时抛出错误', async () => {
      const entity = createTestEntity({ type: 'unknown' as any });

      await expect(transformer.toBlocks(entity)).rejects.toThrow('No schema registered for type: unknown');
    });
  });

  describe('Blocks → Entity 转换', () => {
    it('应该成功将 Blocks 转换为 Entity', async () => {
      const blocks = [
        {
          type: 'page',
          properties: {
            title: { title: [{ text: { content: 'Test Title' } }] },
            description: { rich_text: [{ text: { content: 'Test Description' } }] },
            status: { select: { name: 'active' } }
          }
        }
      ];

      const metadata = {
        id: 'test-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const entity = await transformer.fromBlocks<TestEntity>(blocks, 'test', metadata);

      expect(entity.id).toBe('test-123');
      expect(entity.type).toBe('test');
      expect(entity.properties.title).toBe('Test Title');
      expect(entity.properties.description).toBe('Test Description');
      expect(entity.properties.status).toBe('active');
    });

    it('应该在转换未注册类型时抛出错误', async () => {
      const blocks = [{ type: 'page', properties: {} }];

      await expect(transformer.fromBlocks(blocks, 'unknown' as any)).rejects.toThrow('No schema registered for type: unknown');
    });
  });

  describe('往返转换', () => {
    it('应该支持 Entity → Blocks → Entity 往返转换', async () => {
      const originalEntity = createTestEntity({
        id: 'test-123',
        properties: {
          title: 'Original Title',
          description: 'Original Description',
          status: 'active'
        }
      });

      // Entity → Blocks
      const blocks = await transformer.toBlocks(originalEntity);

      // Blocks → Entity
      const metadata = {
        id: originalEntity.id,
        createdAt: originalEntity.createdAt,
        updatedAt: originalEntity.updatedAt
      };
      const restoredEntity = await transformer.fromBlocks<TestEntity>(blocks, 'test', metadata);

      expect(restoredEntity.id).toBe(originalEntity.id);
      expect(restoredEntity.properties.title).toBe(originalEntity.properties.title);
      expect(restoredEntity.properties.description).toBe(originalEntity.properties.description);
      expect(restoredEntity.properties.status).toBe(originalEntity.properties.status);
    });
  });

  describe('中间件执行', () => {
    it('应该按顺序执行中间件', async () => {
      const executionOrder: string[] = [];

      const middleware1: TransformMiddleware = {
        name: 'middleware1',
        execute: async (input, context, next) => {
          executionOrder.push('middleware1-before');
          const result = await next();
          executionOrder.push('middleware1-after');
          return result;
        }
      };

      const middleware2: TransformMiddleware = {
        name: 'middleware2',
        execute: async (input, context, next) => {
          executionOrder.push('middleware2-before');
          const result = await next();
          executionOrder.push('middleware2-after');
          return result;
        }
      };

      transformer.use(middleware1);
      transformer.use(middleware2);

      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      expect(executionOrder).toEqual([
        'middleware1-before',
        'middleware2-before',
        'middleware2-after',
        'middleware1-after'
      ]);
    });

    it('应该允许中间件修改输入', async () => {
      const modifyMiddleware: TransformMiddleware = {
        name: 'modify',
        execute: async (input, context, next) => {
          if (context.direction === 'toBlocks') {
            input.properties.title = 'Modified Title';
          }
          return next();
        }
      };

      transformer.use(modifyMiddleware);

      const entity = createTestEntity({ properties: { title: 'Original Title' } });
      const blocks = await transformer.toBlocks(entity);

      expect(blocks[0].properties.title.title[0].text.content).toBe('Modified Title');
    });

    it('应该在中间件抛出错误时停止执行', async () => {
      const errorMiddleware: TransformMiddleware = {
        name: 'error',
        execute: async () => {
          throw new Error('Middleware error');
        }
      };

      transformer.use(errorMiddleware);

      const entity = createTestEntity();

      await expect(transformer.toBlocks(entity)).rejects.toThrow('Failed to transform entity to blocks');
    });
  });

  describe('批量转换', () => {
    it('应该批量转换 Entity → Blocks', async () => {
      const entities = [
        createTestEntity({ properties: { title: 'Entity 1' } }),
        createTestEntity({ properties: { title: 'Entity 2' } }),
        createTestEntity({ properties: { title: 'Entity 3' } })
      ];

      const results = await transformer.toBatchBlocks(entities);

      expect(results).toHaveLength(3);
      expect(results[0][0].properties.title.title[0].text.content).toBe('Entity 1');
      expect(results[1][0].properties.title.title[0].text.content).toBe('Entity 2');
      expect(results[2][0].properties.title.title[0].text.content).toBe('Entity 3');
    });

    it('应该在批量转换中处理错误', async () => {
      const entities = [
        createTestEntity({ properties: { title: 'Valid Entity' } }),
        createTestEntity({ type: 'invalid' as any }),
        createTestEntity({ properties: { title: 'Another Valid Entity' } })
      ];

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const results = await transformer.toBatchBlocks(entities);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveLength(1);
      expect(results[1]).toHaveLength(0); // 错误的实体返回空数组
      expect(results[2]).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('应该批量转换 Blocks → Entity', async () => {
      const blocksArray = [
        [{ type: 'page', properties: { title: { title: [{ text: { content: 'Entity 1' } }] } } }],
        [{ type: 'page', properties: { title: { title: [{ text: { content: 'Entity 2' } }] } } }],
        [{ type: 'page', properties: { title: { title: [{ text: { content: 'Entity 3' } }] } } }]
      ];

      const results = await transformer.fromBatchBlocks<TestEntity>(blocksArray, 'test');

      expect(results).toHaveLength(3);
      expect(results[0].properties.title).toBe('Entity 1');
      expect(results[1].properties.title).toBe('Entity 2');
      expect(results[2].properties.title).toBe('Entity 3');
    });
  });
});
