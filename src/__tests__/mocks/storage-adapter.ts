/**
 * Mock 存储适配器
 * 职责: 提供内存存储实现用于测试
 */

import { IUniversalEntity } from '@flowus-limbic/shared-types';
import { IStorage } from '../../sync/engine';

export class MockStorageAdapter<T extends IUniversalEntity> implements IStorage<T> {
  private data = new Map<string, T>();

  async getAll(): Promise<T[]> {
    // 返回所有实体，包括标记为删除的实体
    // 这样同步引擎可以检测到删除操作
    return Array.from(this.data.values());
  }

  async getById(id: string): Promise<T | null> {
    const item = this.data.get(id);
    return item && !item.deleted ? item : null;
  }

  async create(entity: T): Promise<T> {
    this.data.set(entity.id, entity);
    return entity;
  }

  async update(entity: T): Promise<T> {
    this.data.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.data.delete(id);
  }

  async batchCreate(entities: T[]): Promise<T[]> {
    for (const entity of entities) {
      this.data.set(entity.id, entity);
    }
    return entities;
  }

  async batchUpdate(entities: T[]): Promise<T[]> {
    for (const entity of entities) {
      this.data.set(entity.id, entity);
    }
    return entities;
  }

  async batchDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.data.delete(id);
    }
  }

  // 测试辅助方法
  clear(): void {
    this.data.clear();
  }

  size(): number {
    return this.data.size;
  }

  setData(entities: T[]): void {
    this.data.clear();
    for (const entity of entities) {
      this.data.set(entity.id, entity);
    }
  }
}
