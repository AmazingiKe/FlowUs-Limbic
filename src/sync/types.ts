/**
 * 同步引擎类型定义
 * 职责: 定义同步流程中的配置、结果和冲突解决类型
 */

import { IUniversalEntity, Conflict, ConflictStrategy } from '@flowus-limbic/shared-types';

/**
 * 同步选项
 */
export interface SyncOptions {
  /** 冲突解决策略 */
  conflictStrategy: ConflictStrategy;

  /** 是否执行完整同步（false 则只执行增量同步） */
  fullSync?: boolean;

  /** 批量操作大小 */
  batchSize?: number;

  /** 是否启用并行处理 */
  parallel?: boolean;

  /** 超时时间（毫秒） */
  timeout?: number;

  /** 是否跳过验证 */
  skipValidation?: boolean;
}

/**
 * 同步结果
 */
export interface SyncResult {
  /** 是否成功 */
  success: boolean;

  /** 从远程拉取的数量 */
  pulled: number;

  /** 推送到远程的数量 */
  pushed: number;

  /** 本地删除的数量 */
  deletedLocal: number;

  /** 远程删除的数量 */
  deletedRemote: number;

  /** 冲突数量 */
  conflicts: number;

  /** 已解决的冲突数量 */
  resolvedConflicts: number;

  /** 未解决的冲突列表 */
  unresolvedConflicts: Conflict[];

  /** 错误列表 */
  errors: string[];

  /** 同步耗时（毫秒） */
  duration: number;

  /** 同步时间戳 */
  timestamp: string;
}

/**
 * 冲突解决结果
 */
export type ConflictResolution<T extends IUniversalEntity = IUniversalEntity> =
  | { resolved: true; entity: T }
  | { resolved: false; conflict: Conflict<T> };
