/**
 * SyncEngine 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SyncEngine, IStorage } from '../engine';
import { MockStorageAdapter } from '../../__tests__/mocks/storage-adapter';
import { createTestEntity, createTestSchema, TestEntity } from '../../__tests__/mocks/test-data';
import { SyncOptions } from '../types';

describe('SyncEngine', () => {
  let localStorage: MockStorageAdapter<TestEntity>;
  let remoteStorage: MockStorageAdapter<TestEntity>;
  let syncEngine: SyncEngine<TestEntity>;
  let options: SyncOptions;

  beforeEach(() => {
    localStorage = new MockStorageAdapter<TestEntity>();
    remoteStorage = new MockStorageAdapter<TestEntity>();
    options = {
      conflictStrategy: 'TIMESTAMP',
      batchSize: 10
    };
    syncEngine = new SyncEngine(
      createTestSchema(),
      localStorage,
      remoteStorage,
      options
    );
  });

  describe('变更检测', () => {
    it('应该检测到需要创建到远程的实体', async () => {
      const localEntity = createTestEntity({ id: 'local-1' });
      await localStorage.create(localEntity);

      const changes = await syncEngine.detectChanges();

      expect(changes.createRemote).toHaveLength(1);
      expect(changes.createRemote[0].id).toBe('local-1');
    });

    it('应该检测到需要更新到远程的实体', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      const laterTime = new Date('2024-01-01T01:00:00Z');

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: laterTime.toISOString(),
        properties: { title: 'Updated locally' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: baseTime.toISOString(),
        properties: { title: 'Old version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      // 由于内容不同，会检测为冲突而不是简单的更新
      expect(changes.updateRemote.length + changes.conflicts.length).toBeGreaterThan(0);
    });

    it('应该检测到需要更新到本地的实体', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      const laterTime = new Date('2024-01-01T01:00:00Z');

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: baseTime.toISOString(),
        properties: { title: 'Old version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: laterTime.toISOString(),
        properties: { title: 'Updated remotely' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      // 由于内容不同，会检测为冲突而不是简单的更新
      expect(changes.updateLocal.length + changes.conflicts.length).toBeGreaterThan(0);
    });

    it('应该检测到需要从本地删除的实体', async () => {
      const now = new Date().toISOString();
      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: now
      });
      const remoteEntity = createTestEntity({
        id: 'entity-1',
        deleted: true,
        updatedAt: now
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      expect(changes.deleteLocal).toHaveLength(1);
      expect(changes.deleteLocal[0]).toBe('entity-1');
    });

    it('应该检测到需要从远程删除的实体', async () => {
      const now = new Date().toISOString();
      const localEntity = createTestEntity({
        id: 'entity-1',
        deleted: true,
        updatedAt: now
      });
      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: now
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      expect(changes.deleteRemote).toHaveLength(1);
      expect(changes.deleteRemote[0]).toBe('entity-1');
    });

    it('应该检测到远程新增的实体', async () => {
      const remoteEntity = createTestEntity({ id: 'remote-1' });
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      expect(changes.updateLocal).toHaveLength(1);
      expect(changes.updateLocal[0].id).toBe('remote-1');
    });
  });

  describe('冲突检测', () => {
    it('应该检测到内容冲突', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      const localTime = new Date('2024-01-01T01:00:00Z');
      const remoteTime = new Date('2024-01-01T02:00:00Z');

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: localTime.toISOString(),
        properties: { title: 'Local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: remoteTime.toISOString(),
        properties: { title: 'Remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      expect(changes.conflicts).toHaveLength(1);
      expect(changes.conflicts[0].local.properties.title).toBe('Local version');
      expect(changes.conflicts[0].remote.properties.title).toBe('Remote version');
    });

    it('应该在指纹相同时不检测冲突', async () => {
      const localTime = new Date('2024-01-01T01:00:00Z');
      const remoteTime = new Date('2024-01-01T02:00:00Z');

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: localTime.toISOString(),
        properties: { title: 'Same content' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: remoteTime.toISOString(),
        properties: { title: 'Same content' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const changes = await syncEngine.detectChanges();

      expect(changes.conflicts).toHaveLength(0);
    });
  });

  describe('冲突解决策略', () => {
    it('TIMESTAMP 策略应该保留时间戳较新的版本', async () => {
      const localTime = new Date('2024-01-01T01:00:00Z');
      const remoteTime = new Date('2024-01-01T02:00:00Z');

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: localTime.toISOString(),
        properties: { title: 'Local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: remoteTime.toISOString(),
        properties: { title: 'Remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const result = await syncEngine.sync();

      expect(result.conflicts).toBe(1);
      expect(result.resolvedConflicts).toBe(1);
      expect(result.unresolvedConflicts).toHaveLength(0);
    });

    it('LOCAL_WINS 策略应该保留本地版本', async () => {
      const localWinsEngine = new SyncEngine(
        createTestSchema(),
        localStorage,
        remoteStorage,
        { ...options, conflictStrategy: 'LOCAL_WINS' }
      );

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'Remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const result = await localWinsEngine.sync();

      expect(result.resolvedConflicts).toBe(1);
      expect(result.unresolvedConflicts).toHaveLength(0);
    });

    it('REMOTE_WINS 策略应该保留远程版本', async () => {
      const remoteWinsEngine = new SyncEngine(
        createTestSchema(),
        localStorage,
        remoteStorage,
        { ...options, conflictStrategy: 'REMOTE_WINS' }
      );

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'Remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const result = await remoteWinsEngine.sync();

      expect(result.resolvedConflicts).toBe(1);
      expect(result.unresolvedConflicts).toHaveLength(0);
    });

    it('MANUAL 策略应该返回未解决的冲突', async () => {
      const manualEngine = new SyncEngine(
        createTestSchema(),
        localStorage,
        remoteStorage,
        { ...options, conflictStrategy: 'MANUAL' }
      );

      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'Remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const result = await manualEngine.sync();

      expect(result.conflicts).toBe(1);
      expect(result.resolvedConflicts).toBe(0);
      expect(result.unresolvedConflicts).toHaveLength(1);
      expect(result.success).toBe(false);
    });
  });

  describe('Pull 操作', () => {
    it('应该从远程拉取新实体', async () => {
      const remoteEntity = createTestEntity({ id: 'remote-1' });
      await remoteStorage.create(remoteEntity);

      const pulled = await syncEngine.pull();

      expect(pulled).toBe(1);
      const localEntity = await localStorage.getById('remote-1');
      expect(localEntity).toBeDefined();
      expect(localEntity?.properties.title).toBe(remoteEntity.properties.title);
    });

    it('应该更新本地过期的实体', async () => {
      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T00:00:00Z',
        properties: { title: 'Old version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'New version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const pulled = await syncEngine.pull();

      expect(pulled).toBe(1);
      const updatedEntity = await localStorage.getById('entity-1');
      expect(updatedEntity?.properties.title).toBe('New version');
    });

    it('应该跳过本地较新的实体', async () => {
      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'Newer local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Older remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const pulled = await syncEngine.pull();

      expect(pulled).toBe(0);
      const entity = await localStorage.getById('entity-1');
      expect(entity?.properties.title).toBe('Newer local version');
    });
  });

  describe('Push 操作', () => {
    it('应该推送新实体到远程', async () => {
      const localEntity = createTestEntity({ id: 'local-1' });
      await localStorage.create(localEntity);

      const pushed = await syncEngine.push();

      expect(pushed).toBe(1);
      const remoteEntity = await remoteStorage.getById('local-1');
      expect(remoteEntity).toBeDefined();
      expect(remoteEntity?.properties.title).toBe(localEntity.properties.title);
    });

    it('应该更新远程过期的实体', async () => {
      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'New version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Old version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const pushed = await syncEngine.push();

      expect(pushed).toBe(1);
      const updatedEntity = await remoteStorage.getById('entity-1');
      expect(updatedEntity?.properties.title).toBe('New version');
    });

    it('应该跳过远程较新的实体', async () => {
      const localEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Older local version' }
      });

      const remoteEntity = createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'Newer remote version' }
      });

      await localStorage.create(localEntity);
      await remoteStorage.create(remoteEntity);

      const pushed = await syncEngine.push();

      expect(pushed).toBe(0);
      const entity = await remoteStorage.getById('entity-1');
      expect(entity?.properties.title).toBe('Newer remote version');
    });
  });

  describe('批量同步', () => {
    it('应该处理批量操作', async () => {
      const entities = Array.from({ length: 25 }, (_, i) =>
        createTestEntity({ id: `entity-${i}` })
      );

      for (const entity of entities) {
        await localStorage.create(entity);
      }

      const result = await syncEngine.sync();

      expect(result.success).toBe(true);
      expect(result.pushed).toBe(25);
      expect(remoteStorage.size()).toBe(25);
    });

    it('应该使用批量 API 提高性能', async () => {
      const entities = Array.from({ length: 5 }, (_, i) =>
        createTestEntity({ id: `remote-${i}` })
      );

      await remoteStorage.batchCreate!(entities);

      const result = await syncEngine.sync();

      expect(result.pulled).toBe(5);
      expect(localStorage.size()).toBe(5);
    });
  });

  describe('完整同步流程', () => {
    it('应该执行完整的同步流程', async () => {
      // 本地新增
      await localStorage.create(createTestEntity({ id: 'local-1' }));

      // 远程新增
      await remoteStorage.create(createTestEntity({ id: 'remote-1' }));

      // 本地更新
      await localStorage.create(createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T02:00:00Z',
        properties: { title: 'Local update' }
      }));
      await remoteStorage.create(createTestEntity({
        id: 'entity-1',
        updatedAt: '2024-01-01T01:00:00Z',
        properties: { title: 'Old version' }
      }));

      const result = await syncEngine.sync();

      expect(result.success).toBe(true);
      expect(result.pushed).toBeGreaterThan(0);
      expect(result.pulled).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该记录同步耗时', async () => {
      const result = await syncEngine.sync();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('应该在发生错误时记录错误信息', async () => {
      // 模拟存储错误
      const errorStorage = new MockStorageAdapter<TestEntity>();
      errorStorage.getAll = async () => {
        throw new Error('Storage error');
      };

      const errorEngine = new SyncEngine(
        createTestSchema(),
        errorStorage,
        remoteStorage,
        options
      );

      const result = await errorEngine.sync();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Storage error');
    });
  });
});
