/**
 * 验证中间件
 * 职责: 在 toBlocks 转换前验证实体的合法性
 * 场景: 确保只有通过验证的实体才能被转换为 Block
 * 可替换性: 可替换为自定义验证逻辑或第三方验证库
 */

import { TransformMiddleware, TransformContext } from '../transformer';

export const validationMiddleware: TransformMiddleware = {
  name: 'validation',
  execute: async (input, context: TransformContext, next) => {
    // 只在 toBlocks 方向时验证
    if (context.direction === 'toBlocks') {
      // 从上下文中获取 registry
      const registry = context.metadata?.registry;

      if (!registry) {
        // 如果没有 registry，跳过验证
        return next();
      }

      const schema = registry.get(context.entityType);

      // 如果 Schema 定义了 validate 方法，则执行验证
      if (schema.validate) {
        const result = schema.validate(input);

        if (!result.valid) {
          const errorMessage = result.errors?.join(', ') || 'Unknown validation error';
          throw new Error(`Validation failed for entity type "${context.entityType}": ${errorMessage}`);
        }
      }
    }

    // 验证通过，继续执行下一个中间件
    return next();
  }
};
