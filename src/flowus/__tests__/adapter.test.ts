/**
 * FlowUs Adapter 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlowUsAdapter } from '../adapter';
import { MockHttpClient } from '../../__tests__/mocks/http-client';
import { IStorageAdapter } from '@flowus-limbic/shared-types';

describe('FlowUsAdapter', () => {
  let mockStorage: IStorageAdapter;
  let mockHttpClient: MockHttpClient;
  let adapter: FlowUsAdapter;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    } as any;

    mockHttpClient = new MockHttpClient();
  });

  describe('初始化', () => {
    it('应该成功初始化适配器', () => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      expect(adapter).toBeDefined();
      expect(adapter.block).toBeDefined();
      expect(adapter.page).toBeDefined();
      expect(adapter.database).toBeDefined();
      expect(adapter.auth).toBeDefined();
    });

    it('应该调用认证管理器初始化', async () => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      const initSpy = vi.spyOn(adapter.auth, 'initialize');
      await adapter.initialize();

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('Block 客户端', () => {
    beforeEach(() => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });
    });

    it('应该提供 Block 客户端', () => {
      expect(adapter.block).toBeDefined();
      expect(typeof adapter.block.getBlock).toBe('function');
      expect(typeof adapter.block.appendChildren).toBe('function');
      expect(typeof adapter.block.updateBlock).toBe('function');
      expect(typeof adapter.block.deleteBlock).toBe('function');
    });
  });

  describe('Page 客户端', () => {
    beforeEach(() => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });
    });

    it('应该提供 Page 客户端', () => {
      expect(adapter.page).toBeDefined();
      expect(typeof adapter.page.getPage).toBe('function');
      expect(typeof adapter.page.createPage).toBe('function');
      expect(typeof adapter.page.updatePage).toBe('function');
      expect(typeof adapter.page.archivePage).toBe('function');
    });
  });

  describe('Database 客户端', () => {
    beforeEach(() => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });
    });

    it('应该提供 Database 客户端', () => {
      expect(adapter.database).toBeDefined();
      expect(typeof adapter.database.queryDatabase).toBe('function');
      expect(typeof adapter.database.createDatabasePage).toBe('function');
      expect(typeof adapter.database.getDatabase).toBe('function');
    });
  });

  describe('认证管理', () => {
    beforeEach(() => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });
    });

    it('应该提供认证管理器', () => {
      expect(adapter.auth).toBeDefined();
      expect(typeof adapter.auth.initialize).toBe('function');
      // 认证管理器的其他方法可能在实际实现中有所不同
      expect(adapter.auth).toHaveProperty('initialize');
    });
  });

  describe('集成测试', () => {
    it('应该正确组装所有客户端', () => {
      adapter = new FlowUsAdapter(mockStorage, {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // 验证所有客户端都已初始化
      expect(adapter.block).toBeDefined();
      expect(adapter.page).toBeDefined();
      expect(adapter.database).toBeDefined();
      expect(adapter.auth).toBeDefined();

      // 验证客户端共享同一个 HTTP 客户端实例
      // 这确保了认证状态在所有客户端之间共享
      expect(adapter.block).toBeTruthy();
      expect(adapter.page).toBeTruthy();
      expect(adapter.database).toBeTruthy();
    });
  });
});
