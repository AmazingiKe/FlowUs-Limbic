/**
 * Obsidian 存储适配器
 * 职责: 基于 Obsidian Plugin API 实现存储接口
 */

import { Plugin } from 'obsidian';
import { IStorageAdapter } from '@flowus-limbic/shared-types';

export class ObsidianStorageAdapter implements IStorageAdapter {
  private cache: Record<string, any> = {};

  constructor(private plugin: Plugin) {}

  /**
   * 获取存储的值
   */
  async get<T>(key: string): Promise<T | null> {
    // 先从缓存读取
    if (key in this.cache) {
      return this.cache[key] as T;
    }

    try {
      const data = await this.plugin.loadData();
      const value = data?.[key] ?? null;

      // 更新缓存
      if (value !== null) {
        this.cache[key] = value;
      }

      return value as T;
    } catch (error) {
      console.error(`Failed to get key "${key}":`, error);
      return null;
    }
  }

  /**
   * 设置存储的值
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const data = await this.plugin.loadData() || {};
      data[key] = value;

      await this.plugin.saveData(data);

      // 更新缓存
      this.cache[key] = value;
    } catch (error) {
      console.error(`Failed to set key "${key}":`, error);
      throw error;
    }
  }

  /**
   * 删除存储的值
   */
  async remove(key: string): Promise<void> {
    try {
      const data = await this.plugin.loadData() || {};
      delete data[key];

      await this.plugin.saveData(data);

      // 清除缓存
      delete this.cache[key];
    } catch (error) {
      console.error(`Failed to remove key "${key}":`, error);
      throw error;
    }
  }

  /**
   * 获取所有键
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const data = await this.plugin.loadData() || {};
      return Object.keys(data);
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    try {
      await this.plugin.saveData({});
      this.cache = {};
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }
}
