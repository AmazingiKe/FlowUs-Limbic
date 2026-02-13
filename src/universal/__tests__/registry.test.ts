/**
 * Registry 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EntityRegistry } from '../registry';
import { createTestSchema } from '../../__tests__/mocks/test-data';

describe('EntityRegistry', () => {
  let registry: EntityRegistry;

  beforeEach(() => {
    registry = new EntityRegistry();
  });

  describe('注册 Schema', () => {
    it('应该成功注册有效的 Schema', () => {
      const schema = createTestSchema();

      expect(() => registry.register(schema)).not.toThrow();
      expect(registry.has('test')).toBe(true);
    });

    it('应该在重复注册时发出警告', () => {
      const schema = createTestSchema();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      registry.register(schema);
      registry.register(schema);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      );

      consoleSpy.mockRestore();
    });

    it('应该拒绝缺少 type 的 Schema', () => {
      const invalidSchema = { ...createTestSchema(), type: '' };

      expect(() => registry.register(invalidSchema as any)).toThrow('must have a type');
    });

    it('应该拒绝缺少 displayName 的 Schema', () => {
      const invalidSchema = { ...createTestSchema(), displayName: '' };

      expect(() => registry.register(invalidSchema as any)).toThrow('must have a displayName');
    });

    it('应该拒绝缺少 toBlocks 的 Schema', () => {
      const invalidSchema = { ...createTestSchema(), toBlocks: undefined };

      expect(() => registry.register(invalidSchema as any)).toThrow('must have a toBlocks function');
    });

    it('应该拒绝缺少 fromBlocks 的 Schema', () => {
      const invalidSchema = { ...createTestSchema(), fromBlocks: undefined };

      expect(() => registry.register(invalidSchema as any)).toThrow('must have a fromBlocks function');
    });

    it('应该拒绝缺少 getFingerprint 的 Schema', () => {
      const invalidSchema = { ...createTestSchema(), getFingerprint: undefined };

      expect(() => registry.register(invalidSchema as any)).toThrow('must have a getFingerprint function');
    });

    it('应该拒绝没有 title 属性的 Schema', () => {
      const invalidSchema = {
        ...createTestSchema(),
        properties: [
          {
            name: 'Description',
            flowusType: 'rich_text' as const,
            required: false,
            mapTo: 'properties.description'
          }
        ]
      };

      expect(() => registry.register(invalidSchema as any)).toThrow('must have at least one property with flowusType "title"');
    });
  });

  describe('查找 Schema', () => {
    it('应该成功获取已注册的 Schema', () => {
      const schema = createTestSchema();
      registry.register(schema);

      const retrieved = registry.get('test');

      expect(retrieved).toBeDefined();
      expect(retrieved.type).toBe('test');
      expect(retrieved.displayName).toBe('Test Entity');
    });

    it('应该在获取未注册的 Schema 时抛出错误', () => {
      expect(() => registry.get('nonexistent')).toThrow('No schema registered for type: nonexistent');
    });

    it('应该正确检查 Schema 是否存在', () => {
      const schema = createTestSchema();

      expect(registry.has('test')).toBe(false);

      registry.register(schema);

      expect(registry.has('test')).toBe(true);
    });
  });

  describe('获取所有 Schema', () => {
    it('应该返回所有已注册的类型', () => {
      const schema1 = createTestSchema();
      const schema2 = { ...createTestSchema(), type: 'test2', displayName: 'Test 2' };

      registry.register(schema1);
      registry.register(schema2 as any);

      const types = registry.getAllTypes();

      expect(types).toHaveLength(2);
      expect(types).toContain('test');
      expect(types).toContain('test2');
    });

    it('应该返回所有已注册的 Schema', () => {
      const schema1 = createTestSchema();
      const schema2 = { ...createTestSchema(), type: 'test2', displayName: 'Test 2' };

      registry.register(schema1);
      registry.register(schema2 as any);

      const schemas = registry.getAllSchemas();

      expect(schemas).toHaveLength(2);
      expect(schemas.map(s => s.type)).toContain('test');
      expect(schemas.map(s => s.type)).toContain('test2');
    });
  });

  describe('锁定机制', () => {
    it('应该在锁定后拒绝注册新 Schema', () => {
      const schema = createTestSchema();

      registry.lock();

      expect(() => registry.register(schema)).toThrow('Registry is locked');
    });

    it('应该在解锁后允许注册新 Schema', () => {
      const schema = createTestSchema();

      registry.lock();
      registry.unlock();

      expect(() => registry.register(schema)).not.toThrow();
    });

    it('应该在锁定后仍然允许查询 Schema', () => {
      const schema = createTestSchema();
      registry.register(schema);

      registry.lock();

      expect(() => registry.get('test')).not.toThrow();
      expect(registry.has('test')).toBe(true);
    });
  });
});
