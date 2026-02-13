/**
 * 冲突解决器
 * 职责: 提供多种冲突解决策略的实现
 * 场景: 当本地和远程数据同时修改时，根据策略决定保留哪个版本
 * 可替换性: 可通过实现 IConflictResolver 接口添加自定义策略
 */

import { IUniversalEntity, Conflict } from '@flowus-limbic/shared-types';
import { ConflictResolution } from './types';

/**
 * 冲突解决器接口
 */
export interface IConflictResolver<T extends IUniversalEntity = IUniversalEntity> {
  /**
   * 解决冲突
   * @param conflict 冲突信息
   * @returns 解决结果
   */
  resolve(conflict: Conflict<T>): ConflictResolution<T>;
}

/**
 * 远程优先解决器
 * 策略: 始终保留远程版本
 */
export class RemoteWinsResolver<T extends IUniversalEntity = IUniversalEntity>
  implements IConflictResolver<T> {

  resolve(conflict: Conflict<T>): ConflictResolution<T> {
    return {
      resolved: true,
      entity: conflict.remote
    };
  }
}

/**
 * 本地优先解决器
 * 策略: 始终保留本地版本
 */
export class LocalWinsResolver<T extends IUniversalEntity = IUniversalEntity>
  implements IConflictResolver<T> {

  resolve(conflict: Conflict<T>): ConflictResolution<T> {
    return {
      resolved: true,
      entity: conflict.local
    };
  }
}

/**
 * 时间戳解决器
 * 策略: 保留更新时间较新的版本
 */
export class TimestampResolver<T extends IUniversalEntity = IUniversalEntity>
  implements IConflictResolver<T> {

  resolve(conflict: Conflict<T>): ConflictResolution<T> {
    const localTime = new Date(conflict.local.updatedAt).getTime();
    const remoteTime = new Date(conflict.remote.updatedAt).getTime();

    return {
      resolved: true,
      entity: localTime >= remoteTime ? conflict.local : conflict.remote
    };
  }
}

/**
 * 手动解决器
 * 策略: 不自动解决，返回冲突供用户手动处理
 */
export class ManualResolver<T extends IUniversalEntity = IUniversalEntity>
  implements IConflictResolver<T> {

  resolve(conflict: Conflict<T>): ConflictResolution<T> {
    return {
      resolved: false,
      conflict
    };
  }
}

/**
 * 解决器工厂
 * 职责: 根据策略类型创建对应的解决器实例
 */
export class ResolverFactory {
  static create<T extends IUniversalEntity = IUniversalEntity>(
    strategy: 'REMOTE_WINS' | 'LOCAL_WINS' | 'TIMESTAMP' | 'MANUAL'
  ): IConflictResolver<T> {
    switch (strategy) {
      case 'REMOTE_WINS':
        return new RemoteWinsResolver<T>();
      case 'LOCAL_WINS':
        return new LocalWinsResolver<T>();
      case 'TIMESTAMP':
        return new TimestampResolver<T>();
      case 'MANUAL':
        return new ManualResolver<T>();
      default:
        throw new Error(`未知的冲突解决策略: ${strategy}`);
    }
  }
}
