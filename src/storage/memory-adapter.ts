/**
 * 内存存储适配器
 * 职责: 用于测试和临时存储
 */

import { IStorageAdapter } from '@flowus-limbic/shared-types';

export class MemoryStorageAdapter implements IStorageAdapter {
  private store = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * 创建快照 (用于测试)
   */
  snapshot(): Record<string, any> {
    return Object.fromEntries(this.store.entries());
  }

  /**
   * 恢复快照 (用于测试)
   */
  restore(snapshot: Record<string, any>): void {
    this.store.clear();
    Object.entries(snapshot).forEach(([key, value]) => {
      this.store.set(key, value);
    });
  }
}
