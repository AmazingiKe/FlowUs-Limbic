/**
 * 中间件单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { TransformerEngine, TransformMiddleware } from '../transformer';
import { EntityRegistry } from '../registry';
import { validationMiddleware } from '../middlewares/validation';
import { loggingMiddleware } from '../middlewares/logging';
import { createTestEntity, createTestSchema } from '../../__tests__/mocks/test-data';

describe('Middlewares', () => {
  describe('ValidationMiddleware', () => {
    it('应该通过有效实体的验证', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(validationMiddleware);

      const entity = createTestEntity({
        properties: {
          title: 'Valid Title',
          description: 'Valid Description',
          status: 'active'
        }
      });

      await expect(transformer.toBlocks(entity)).resolves.toBeDefined();
    });

    it('应该拒绝缺少必填字段的实体', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(validationMiddleware);

      const entity = createTestEntity({
        properties: {
          title: '',
          description: 'Description',
          status: 'active'
        }
      });

      await expect(transformer.toBlocks(entity)).rejects.toThrow('Validation failed');
      await expect(transformer.toBlocks(entity)).rejects.toThrow('Title is required');
    });

    it('应该拒绝无效状态值的实体', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(validationMiddleware);

      const entity = createTestEntity({
        properties: {
          title: 'Valid Title',
          description: 'Description',
          status: 'invalid-status'
        }
      });

      await expect(transformer.toBlocks(entity)).rejects.toThrow('Validation failed');
      await expect(transformer.toBlocks(entity)).rejects.toThrow('Invalid status value');
    });

    it('应该只在 toBlocks 方向验证', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(validationMiddleware);

      const blocks = [
        {
          type: 'page',
          properties: {
            title: { title: [{ text: { content: '' } }] }, // 空标题
            description: { rich_text: [] },
            status: { select: { name: 'invalid' } } // 无效状态
          }
        }
      ];

      // fromBlocks 不应该触发验证
      await expect(transformer.fromBlocks(blocks, 'test')).resolves.toBeDefined();
    });

    it('应该在没有 validate 方法时跳过验证', async () => {
      const schemaWithoutValidation = {
        ...createTestSchema(),
        validate: undefined
      };

      const registry = new EntityRegistry();
      registry.register(schemaWithoutValidation as any);

      const transformer = new TransformerEngine(registry);
      transformer.use(validationMiddleware);

      const entity = createTestEntity({
        properties: {
          title: '', // 空标题，但不会验证
          description: 'Description',
          status: 'active'
        }
      });

      await expect(transformer.toBlocks(entity)).resolves.toBeDefined();
    });
  });

  describe('LoggingMiddleware', () => {
    it('应该记录转换开始和完成', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(loggingMiddleware);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 开始转换: Entity → Blocks')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 转换完成: Entity → Blocks')
      );

      consoleSpy.mockRestore();
    });

    it('应该记录转换耗时', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(loggingMiddleware);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      const completionLog = consoleSpy.mock.calls.find(call =>
        call[0].includes('转换完成')
      );

      expect(completionLog).toBeDefined();
      expect(completionLog![0]).toMatch(/耗时: \d+ms/);

      consoleSpy.mockRestore();
    });

    it('应该记录转换错误', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(loggingMiddleware);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // 创建一个会导致转换失败的中间件
      const errorMiddleware: TransformMiddleware = {
        name: 'error',
        execute: async () => {
          throw new Error('Middleware error');
        }
      };

      transformer.use(errorMiddleware);
      const entity = createTestEntity();

      await expect(transformer.toBlocks(entity)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 转换失败'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('应该区分 toBlocks 和 fromBlocks 方向', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);
      transformer.use(loggingMiddleware);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // toBlocks
      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Entity → Blocks')
      );

      consoleSpy.mockClear();

      // fromBlocks
      const blocks = [
        {
          type: 'page',
          properties: {
            title: { title: [{ text: { content: 'Test' } }] }
          }
        }
      ];
      await transformer.fromBlocks(blocks, 'test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocks → Entity')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('自定义中间件', () => {
    it('应该支持同步中间件', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);

      let executed = false;

      const syncMiddleware: TransformMiddleware = {
        name: 'sync',
        execute: (input, context, next) => {
          executed = true;
          return next();
        }
      };

      transformer.use(syncMiddleware);

      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      expect(executed).toBe(true);
    });

    it('应该支持异步中间件', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);

      let executed = false;

      const asyncMiddleware: TransformMiddleware = {
        name: 'async',
        execute: async (input, context, next) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          executed = true;
          return next();
        }
      };

      transformer.use(asyncMiddleware);

      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      expect(executed).toBe(true);
    });

    it('应该允许中间件访问上下文', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);

      let capturedContext: any = null;

      const contextMiddleware: TransformMiddleware = {
        name: 'context',
        execute: async (input, context, next) => {
          capturedContext = context;
          return next();
        }
      };

      transformer.use(contextMiddleware);

      const entity = createTestEntity();
      await transformer.toBlocks(entity);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.entityType).toBe('test');
      expect(capturedContext.direction).toBe('toBlocks');
    });

    it('应该允许中间件短路执行', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);

      const shortCircuitMiddleware: TransformMiddleware = {
        name: 'shortCircuit',
        execute: async () => {
          return [{ type: 'custom', data: 'short-circuited' }];
        }
      };

      transformer.use(shortCircuitMiddleware);

      const entity = createTestEntity();
      const result = await transformer.toBlocks(entity);

      expect(result).toEqual([{ type: 'custom', data: 'short-circuited' }]);
    });
  });

  describe('中间件组合', () => {
    it('应该支持多个中间件协同工作', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      transformer.use(loggingMiddleware);
      transformer.use(validationMiddleware);

      const entity = createTestEntity({
        properties: {
          title: 'Valid Title',
          description: 'Valid Description',
          status: 'active'
        }
      });

      await transformer.toBlocks(entity);

      // 验证日志中间件被执行
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 开始转换')
      );

      // 验证验证中间件被执行（没有抛出错误）
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 转换完成')
      );

      consoleSpy.mockRestore();
    });

    it('应该在验证失败时记录错误', async () => {
      const registry = new EntityRegistry();
      registry.register(createTestSchema());
      const transformer = new TransformerEngine(registry);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transformer.use(loggingMiddleware);
      transformer.use(validationMiddleware);

      const entity = createTestEntity({
        properties: {
          title: '', // 无效
          description: 'Description',
          status: 'active'
        }
      });

      await expect(transformer.toBlocks(entity)).rejects.toThrow('Validation failed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 开始转换')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Transform] 转换失败'),
        expect.any(Error)
      );

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
