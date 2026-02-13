/**
 * 实体注册中心
 * 职责: 管理所有数据类型的 Schema 定义
 */

import { EntityType, EntitySchema, IUniversalEntity } from '@flowus-limbic/shared-types';

export class EntityRegistry {
  private schemas = new Map<EntityType, EntitySchema>();
  private locked = false;

  /**
   * 注册实体 Schema
   */
  register<T extends IUniversalEntity>(schema: EntitySchema<T>): void {
    if (this.locked) {
      throw new Error('Registry is locked, cannot register new schemas');
    }

    // 验证 Schema 完整性
    this.validateSchema(schema as unknown as EntitySchema);

    if (this.schemas.has(schema.type)) {
      console.warn(`Schema for type "${schema.type}" already exists, overwriting`);
    }

    this.schemas.set(schema.type, schema as unknown as EntitySchema);
  }

  /**
   * 获取指定类型的 Schema
   */
  get<T extends IUniversalEntity>(type: EntityType): EntitySchema<T> {
    const schema = this.schemas.get(type);
    if (!schema) {
      throw new Error(`No schema registered for type: ${type}`);
    }
    return schema as unknown as EntitySchema<T>;
  }

  /**
   * 检查类型是否已注册
   */
  has(type: EntityType): boolean {
    return this.schemas.has(type);
  }

  /**
   * 获取所有已注册类型
   */
  getAllTypes(): EntityType[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * 获取所有 Schema
   */
  getAllSchemas(): EntitySchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * 锁定注册中心 (生产环境)
   */
  lock(): void {
    this.locked = true;
  }

  /**
   * 解锁注册中心 (开发模式)
   */
  unlock(): void {
    this.locked = false;
  }

  /**
   * 验证 Schema 完整性
   */
  private validateSchema(schema: EntitySchema): void {
    if (!schema.type) {
      throw new Error('Schema must have a type');
    }
    if (!schema.displayName) {
      throw new Error('Schema must have a displayName');
    }
    if (!schema.toBlocks || typeof schema.toBlocks !== 'function') {
      throw new Error('Schema must have a toBlocks function');
    }
    if (!schema.fromBlocks || typeof schema.fromBlocks !== 'function') {
      throw new Error('Schema must have a fromBlocks function');
    }
    if (!schema.getFingerprint || typeof schema.getFingerprint !== 'function') {
      throw new Error('Schema must have a getFingerprint function');
    }

    // 验证至少有一个 title 类型属性
    const hasTitleProperty = schema.properties.some((p: any) => p.flowusType === 'title');
    if (!hasTitleProperty) {
      throw new Error('Schema must have at least one property with flowusType "title"');
    }
  }
}

// 全局单例
export const registry = new EntityRegistry();
