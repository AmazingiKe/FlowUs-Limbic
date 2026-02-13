/**
 * 中间件统一导出
 * 职责: 导出所有内置中间件，提供便捷的导入方式
 */

export { validationMiddleware } from './validation';
export { loggingMiddleware } from './logging';

/**
 * 使用示例:
 *
 * ```typescript
 * import { TransformerEngine } from './universal/transformer';
 * import { registry } from './universal/registry';
 * import { validationMiddleware, loggingMiddleware } from './universal/middlewares';
 *
 * const transformer = new TransformerEngine(registry);
 *
 * // 注册内置中间件
 * transformer.use(validationMiddleware);
 * transformer.use(loggingMiddleware);
 *
 * // 使用转换引擎
 * const blocks = transformer.toBlocks(entity);
 * ```
 *
 * 自定义中间件示例:
 *
 * ```typescript
 * import { TransformMiddleware } from './universal/transformer';
 *
 * // 加密中间件
 * const encryptionMiddleware: TransformMiddleware = {
 *   name: 'encryption',
 *   execute: async (input, context, next) => {
 *     if (context.direction === 'toBlocks') {
 *       // 在转换前加密敏感字段
 *       const encrypted = encryptSensitiveFields(input);
 *       return next();
 *     }
 *     return next();
 *   }
 * };
 *
 * // 缓存中间件
 * const cacheMiddleware: TransformMiddleware = {
 *   name: 'cache',
 *   execute: async (input, context, next) => {
 *     const cacheKey = `${context.entityType}:${context.direction}:${JSON.stringify(input)}`;
 *
 *     // 检查缓存
 *     const cached = cache.get(cacheKey);
 *     if (cached) {
 *       console.log('[Cache] 命中缓存');
 *       return cached;
 *     }
 *
 *     // 执行转换
 *     const result = await next();
 *
 *     // 存入缓存
 *     cache.set(cacheKey, result);
 *     return result;
 *   }
 * };
 *
 * transformer.use(encryptionMiddleware);
 * transformer.use(cacheMiddleware);
 * ```
 */
