/**
 * 同步引擎
 * 职责: 协调本地与远程数据的双向同步，处理冲突和错误
 * 场景: 支持任意实体类型的增量同步，基于时间戳和指纹检测变更
 * 可替换性: 通过依赖注入可替换存储层和冲突解决策略
 */

import {
  IUniversalEntity,
  EntitySchema,
  Conflict,
  SyncActionType
} from '@flowus-limbic/shared-types';
import { SyncOptions, SyncResult, ConflictResolution } from './types';
import { IConflictResolver, ResolverFactory } from './resolver';

/**
 * 存储接口
 * 定义本地和远程数据访问的统一接口
 */
export interface IStorage<T extends IUniversalEntity> {
  /** 获取所有实体 */
  getAll(): Promise<T[]>;

  /** 根据 ID 获取实体 */
  getById(id: string): Promise<T | null>;

  /** 创建实体 */
  create(entity: T): Promise<T>;

  /** 更新实体 */
  update(entity: T): Promise<T>;

  /** 删除实体 */
  delete(id: string): Promise<void>;

  /** 批量创建 */
  batchCreate?(entities: T[]): Promise<T[]>;

  /** 批量更新 */
  batchUpdate?(entities: T[]): Promise<T[]>;

  /** 批量删除 */
  batchDelete?(ids: string[]): Promise<void>;
}

/**
 * 变更检测结果
 */
interface ChangeDetection<T extends IUniversalEntity> {
  /** 需要创建到远程 */
  createRemote: T[];

  /** 需要更新到远程 */
  updateRemote: T[];

  /** 需要更新到本地 */
  updateLocal: T[];

  /** 需要从本地删除 */
  deleteLocal: string[];

  /** 需要从远程删除 */
  deleteRemote: string[];

  /** 检测到的冲突 */
  conflicts: Conflict<T>[];
}

/**
 * 泛型同步引擎
 */
export class SyncEngine<T extends IUniversalEntity> {
  private resolver: IConflictResolver<T>;

  constructor(
    private readonly schema: EntitySchema<T>,
    private readonly localStorage: IStorage<T>,
    private readonly remoteStorage: IStorage<T>,
    private readonly options: SyncOptions
  ) {
    this.resolver = ResolverFactory.create<T>(options.conflictStrategy);
  }

  /**
   * 执行完整同步流程
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      pulled: 0,
      pushed: 0,
      deletedLocal: 0,
      deletedRemote: 0,
      conflicts: 0,
      resolvedConflicts: 0,
      unresolvedConflicts: [],
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. 检测变更
      const changes = await this.detectChanges();

      // 2. 处理冲突
      const { resolved, unresolved } = await this.resolveConflicts(changes.conflicts);
      result.conflicts = changes.conflicts.length;
      result.resolvedConflicts = resolved.length;
      result.unresolvedConflicts = unresolved;

      // 将已解决的冲突合并到更新列表
      for (const entity of resolved) {
        const localTime = new Date(entity.updatedAt).getTime();
        const originalLocal = changes.conflicts.find(c => c.local.id === entity.id)?.local;

        if (originalLocal) {
          const originalLocalTime = new Date(originalLocal.updatedAt).getTime();
          if (localTime > originalLocalTime) {
            changes.updateRemote.push(entity);
          } else {
            changes.updateLocal.push(entity);
          }
        }
      }

      // 3. 执行同步操作
      await this.executePull(changes.updateLocal);
      result.pulled = changes.updateLocal.length;

      await this.executePush(changes.createRemote, changes.updateRemote);
      result.pushed = changes.createRemote.length + changes.updateRemote.length;

      await this.executeDelete(changes.deleteLocal, changes.deleteRemote);
      result.deletedLocal = changes.deleteLocal.length;
      result.deletedRemote = changes.deleteRemote.length;

      result.success = result.unresolvedConflicts.length === 0;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * 从远程拉取数据
   */
  async pull(): Promise<number> {
    const remoteItems = await this.remoteStorage.getAll();
    const localItems = await this.localStorage.getAll();
    const localMap = new Map(localItems.map(item => [item.id, item]));

    let pulled = 0;

    for (const remoteItem of remoteItems) {
      const localItem = localMap.get(remoteItem.id);

      if (!localItem) {
        // 远程有，本地无 -> 创建到本地
        await this.localStorage.create(remoteItem);
        pulled++;
      } else {
        // 比较时间戳，远程更新则拉取
        const remoteTime = new Date(remoteItem.updatedAt).getTime();
        const localTime = new Date(localItem.updatedAt).getTime();

        if (remoteTime > localTime) {
          await this.localStorage.update(remoteItem);
          pulled++;
        }
      }
    }

    return pulled;
  }

  /**
   * 推送数据到远程
   */
  async push(): Promise<number> {
    const localItems = await this.localStorage.getAll();
    const remoteItems = await this.remoteStorage.getAll();
    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

    let pushed = 0;

    for (const localItem of localItems) {
      const remoteItem = remoteMap.get(localItem.id);

      if (!remoteItem) {
        // 本地有，远程无 -> 创建到远程
        await this.remoteStorage.create(localItem);
        pushed++;
      } else {
        // 比较时间戳，本地更新则推送
        const localTime = new Date(localItem.updatedAt).getTime();
        const remoteTime = new Date(remoteItem.updatedAt).getTime();

        if (localTime > remoteTime) {
          await this.remoteStorage.update(localItem);
          pushed++;
        }
      }
    }

    return pushed;
  }

  /**
   * 检测变更
   */
  async detectChanges(): Promise<ChangeDetection<T>> {
    const [localItems, remoteItems] = await Promise.all([
      this.localStorage.getAll(),
      this.remoteStorage.getAll()
    ]);

    const localMap = new Map(localItems.map(item => [item.id, item]));
    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

    const result: ChangeDetection<T> = {
      createRemote: [],
      updateRemote: [],
      updateLocal: [],
      deleteLocal: [],
      deleteRemote: [],
      conflicts: []
    };

    // 处理本地项
    for (const localItem of localItems) {
      if (localItem.deleted) {
        // 本地标记删除
        if (remoteMap.has(localItem.id)) {
          result.deleteRemote.push(localItem.id);
        }
        continue;
      }

      const remoteItem = remoteMap.get(localItem.id);

      if (!remoteItem) {
        // 本地有，远程无 -> 创建到远程
        result.createRemote.push(localItem);
      } else if (remoteItem.deleted) {
        // 远程标记删除 -> 删除本地
        result.deleteLocal.push(localItem.id);
      } else {
        // 两边都有，检测冲突
        const conflict = this.detectConflict(localItem, remoteItem);
        if (conflict) {
          result.conflicts.push(conflict);
        } else {
          // 无冲突，比较时间戳
          const localTime = new Date(localItem.updatedAt).getTime();
          const remoteTime = new Date(remoteItem.updatedAt).getTime();

          if (localTime > remoteTime) {
            result.updateRemote.push(localItem);
          } else if (remoteTime > localTime) {
            result.updateLocal.push(remoteItem);
          }
        }
      }
    }

    // 处理远程有但本地没有的项
    for (const remoteItem of remoteItems) {
      if (!localMap.has(remoteItem.id) && !remoteItem.deleted) {
        // 远程有，本地无 -> 创建到本地
        result.updateLocal.push(remoteItem);
      }
    }

    return result;
  }

  /**
   * 检测冲突
   * 当本地和远程都修改了同一实体，且指纹不同时产生冲突
   */
  private detectConflict(local: T, remote: T): Conflict<T> | null {
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    // 时间戳相同，无冲突
    if (localTime === remoteTime) {
      return null;
    }

    // 计算指纹
    const localFingerprint = this.schema.getFingerprint(local);
    const remoteFingerprint = this.schema.getFingerprint(remote);

    // 指纹相同，无冲突
    if (localFingerprint === remoteFingerprint) {
      return null;
    }

    // 存在冲突
    return { local, remote };
  }

  /**
   * 解决冲突
   */
  private async resolveConflicts(
    conflicts: Conflict<T>[]
  ): Promise<{ resolved: T[]; unresolved: Conflict<T>[] }> {
    const resolved: T[] = [];
    const unresolved: Conflict<T>[] = [];

    for (const conflict of conflicts) {
      const resolution = this.resolver.resolve(conflict);

      if (resolution.resolved) {
        resolved.push(resolution.entity);
      } else {
        unresolved.push(resolution.conflict);
      }
    }

    return { resolved, unresolved };
  }

  /**
   * 执行拉取操作
   */
  private async executePull(items: T[]): Promise<void> {
    if (items.length === 0) return;

    if (this.options.batchSize && items.length > this.options.batchSize) {
      // 批量处理
      for (let i = 0; i < items.length; i += this.options.batchSize) {
        const batch = items.slice(i, i + this.options.batchSize);
        await this.processPullBatch(batch);
      }
    } else {
      await this.processPullBatch(items);
    }
  }

  /**
   * 处理拉取批次
   */
  private async processPullBatch(items: T[]): Promise<void> {
    if (this.localStorage.batchUpdate && items.length > 1) {
      await this.localStorage.batchUpdate(items);
    } else {
      for (const item of items) {
        const existing = await this.localStorage.getById(item.id);
        if (existing) {
          await this.localStorage.update(item);
        } else {
          await this.localStorage.create(item);
        }
      }
    }
  }

  /**
   * 执行推送操作
   */
  private async executePush(createItems: T[], updateItems: T[]): Promise<void> {
    if (createItems.length === 0 && updateItems.length === 0) return;

    // 处理创建
    if (createItems.length > 0) {
      if (this.remoteStorage.batchCreate && createItems.length > 1) {
        await this.remoteStorage.batchCreate(createItems);
      } else {
        for (const item of createItems) {
          await this.remoteStorage.create(item);
        }
      }
    }

    // 处理更新
    if (updateItems.length > 0) {
      if (this.remoteStorage.batchUpdate && updateItems.length > 1) {
        await this.remoteStorage.batchUpdate(updateItems);
      } else {
        for (const item of updateItems) {
          await this.remoteStorage.update(item);
        }
      }
    }
  }

  /**
   * 执行删除操作
   */
  private async executeDelete(localIds: string[], remoteIds: string[]): Promise<void> {
    // 删除本地
    if (localIds.length > 0) {
      if (this.localStorage.batchDelete && localIds.length > 1) {
        await this.localStorage.batchDelete(localIds);
      } else {
        for (const id of localIds) {
          await this.localStorage.delete(id);
        }
      }
    }

    // 删除远程
    if (remoteIds.length > 0) {
      if (this.remoteStorage.batchDelete && remoteIds.length > 1) {
        await this.remoteStorage.batchDelete(remoteIds);
      } else {
        for (const id of remoteIds) {
          await this.remoteStorage.delete(id);
        }
      }
    }
  }
}
