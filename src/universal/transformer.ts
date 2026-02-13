/**
 * 转换引擎
 * 职责: 执行 Entity ↔ Block 双向转换
 */

import { EntityType, IUniversalEntity } from '@flowus-limbic/shared-types';
import { EntityRegistry } from './registry';

/**
 * 转换上下文
 */
export interface TransformContext {
  entityType: EntityType;
  direction: 'toBlocks' | 'fromBlocks';
  metadata?: Record<string, any>;
}

/**
 * 转换中间件
 *
 * 使用示例:
 * ```typescript
 * import { validationMiddleware, loggingMiddleware } from './middlewares';
 *
 * const transformer = new TransformerEngine(registry);
 *
 * // 注册内置中间件
 * transformer.use(validationMiddleware);  // 验证实体合法性
 * transformer.use(loggingMiddleware);     // 记录转换日志
 *
 * // 使用转换引擎
 * const blocks = await transformer.toBlocks(entity);
 * const entity = await transformer.fromBlocks(blocks, 'todo');
 * ```
 */
export interface TransformMiddleware {
  name: string;
  execute: (
    input: any,
    context: TransformContext,
    next: () => any | Promise<any>
  ) => any | Promise<any>;
}

/**
 * 转换引擎
 */
export class TransformerEngine {
  private middlewares: TransformMiddleware[] = [];

  constructor(private registry: EntityRegistry) {}

  /**
   * 注册中间件
   */
  use(middleware: TransformMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Entity → Block[]
   */
  async toBlocks<T extends IUniversalEntity>(entity: T): Promise<any[]> {
    const schema = this.registry.get<T>(entity.type);

    const context: TransformContext = {
      entityType: entity.type,
      direction: 'toBlocks',
      metadata: {
        registry: this.registry
      }
    };

    try {
      const result = await this.executeMiddlewares(
        entity,
        context,
        () => schema.toBlocks(entity)
      );

      return result;
    } catch (error) {
      throw new Error(
        `Failed to transform entity to blocks: ${(error as Error).message}`
      );
    }
  }

  /**
   * Block[] → Entity
   */
  async fromBlocks<T extends IUniversalEntity>(
    blocks: any[],
    entityType: EntityType,
    metadata?: any
  ): Promise<T> {
    const schema = this.registry.get<T>(entityType);

    const context: TransformContext = {
      entityType,
      direction: 'fromBlocks',
      metadata
    };

    try {
      const result = await this.executeMiddlewares(
        blocks,
        context,
        () => schema.fromBlocks(blocks, metadata)
      );

      return result;
    } catch (error) {
      throw new Error(
        `Failed to transform blocks to entity: ${(error as Error).message}`
      );
    }
  }

  /**
   * 批量转换 Entity → Block[]
   */
  async toBatchBlocks<T extends IUniversalEntity>(entities: T[]): Promise<any[][]> {
    const results: any[][] = [];

    for (const entity of entities) {
      try {
        const blocks = await this.toBlocks(entity);
        results.push(blocks);
      } catch (error) {
        console.error(`Failed to transform entity ${entity.id}:`, error);
        results.push([]);
      }
    }

    return results;
  }

  /**
   * 批量转换 Block[] → Entity
   */
  async fromBatchBlocks<T extends IUniversalEntity>(
    blocksArray: any[][],
    entityType: EntityType
  ): Promise<T[]> {
    const results: (T | null)[] = [];

    for (let index = 0; index < blocksArray.length; index++) {
      try {
        const entity = await this.fromBlocks<T>(blocksArray[index], entityType);
        results.push(entity);
      } catch (error) {
        console.error(`Failed to transform blocks at index ${index}:`, error);
        results.push(null);
      }
    }

    return results.filter(Boolean) as T[];
  }

  /**
   * 执行中间件管道
   * 支持同步和异步中间件
   */
  private async executeMiddlewares(
    input: any,
    context: TransformContext,
    finalHandler: () => any | Promise<any>
  ): Promise<any> {
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= this.middlewares.length) {
        return await finalHandler();
      }

      const middleware = this.middlewares[index++];
      return await middleware.execute(input, context, next);
    };

    return await next();
  }
}
