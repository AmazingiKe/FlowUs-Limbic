/**
 * 日志中间件
 * 职责: 记录转换过程的开始、结束、耗时和错误
 * 场景: 用于调试和性能监控
 * 可替换性: 可替换为更高级的日志系统（如 Winston、Pino）
 */

import { TransformMiddleware, TransformContext } from '../transformer';

export const loggingMiddleware: TransformMiddleware = {
  name: 'logging',
  execute: async (input, context: TransformContext, next) => {
    const direction = context.direction === 'toBlocks' ? 'Entity → Blocks' : 'Blocks → Entity';
    console.log(`[Transform] 开始转换: ${direction} (类型: ${context.entityType})`);

    const startTime = Date.now();

    try {
      // 执行下一个中间件或最终转换
      const result = await next();

      const duration = Date.now() - startTime;
      console.log(`[Transform] 转换完成: ${direction} (耗时: ${duration}ms)`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Transform] 转换失败: ${direction} (耗时: ${duration}ms)`, error);

      // 重新抛出错误，让上层处理
      throw error;
    }
  }
};
