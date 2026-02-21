/**
 * 同步相关类型定义
 */

import { IUniversalEntity } from './entity';

/**
 * 同步操作类型
 */
export enum SyncActionType {
  CREATE_REMOTE = 'CREATE_REMOTE',   // 本地有，远程无 -> 推送到远程
  UPDATE_REMOTE = 'UPDATE_REMOTE',   // 本地新，远程旧 -> 更新到远程
  UPDATE_LOCAL = 'UPDATE_LOCAL',     // 远程新，本地旧 -> 更新到本地
  DELETE_LOCAL = 'DELETE_LOCAL',     // 远程已删除 -> 本地删除
  DELETE_REMOTE = 'DELETE_REMOTE',   // 本地已删除 -> 远程删除
  NO_OP = 'NO_OP'                    // 无需操作
}

/**
 * 同步动作
 */
export interface SyncAction<T extends IUniversalEntity = IUniversalEntity> {
  type: SyncActionType;
  item: T;
  reason?: string;  // 操作原因 (用于调试)
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  pulled: number;      // 从远程拉取的数量
  pushed: number;      // 推送到远程的数量
  conflicts: number;   // 冲突数量
  errors: string[];    // 错误列表
}

/**
 * 同步状态
 */
export enum SyncState {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

/**
 * 冲突解决策略
 */
export enum ConflictStrategy {
  REMOTE_WINS = 'REMOTE_WINS',     // 远程优先
  LOCAL_WINS = 'LOCAL_WINS',       // 本地优先
  TIMESTAMP = 'TIMESTAMP',         // 时间戳较新者胜
  MANUAL = 'MANUAL'                // 手动选择
}

/**
 * 冲突信息
 */
export interface Conflict<T extends IUniversalEntity = IUniversalEntity> {
  local: T;
  remote: T;
  resolution?: T;  // 解决后的结果
}
