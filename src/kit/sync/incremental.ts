import { TodoItem } from '../types';

/**
 * SyncActionType - 同步操作类型
 * 职责: 定义对数据的原子操作
 */
export enum SyncActionType {
  CREATE_REMOTE = 'CREATE_REMOTE', // 本地有，远程无 -> 推送到远程
  UPDATE_REMOTE = 'UPDATE_REMOTE', // 本地新，远程旧 -> 更新到远程
  UPDATE_LOCAL = 'UPDATE_LOCAL',   // 远程新，本地旧 -> 更新到本地
  DELETE_LOCAL = 'DELETE_LOCAL',   // 远程已删除 -> 本地删除
  DELETE_REMOTE = 'DELETE_REMOTE', // 本地已删除 -> 远程删除
  NO_OP = 'NO_OP'                  // 无需操作
}

/**
 * SyncAction - 同步动作指令
 * 职责: 携带具体的操作数据
 */
export interface SyncAction {
  type: SyncActionType;
  item: TodoItem;
}

/**
 * SyncEngine - 增量同步引擎
 * 职责: 计算本地与远程数据的差异并生成同步计划
 * 场景: 用于实现 FlowUs 与本地数据的双向同步，采用“远程优先”冲突解决策略
 */
export class SyncEngine {
  /**
   * 生成同步计划
   * @param localItems 本地数据列表
   * @param remoteItems 远程数据列表
   * @returns 同步动作数组
   */
  public generatePlan(localItems: TodoItem[], remoteItems: TodoItem[]): SyncAction[] {
    const plan: SyncAction[] = [];
    const localMap = new Map(localItems.map(item => [item.id, item]));
    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

    // 1. 处理所有本地项
    for (const localItem of localItems) {
      const remoteItem = remoteMap.get(localItem.id);

      if (!remoteItem) {
        // 场景: 本地有但远程没有
        // 逻辑: 如果是新创建的（没有远程 ID 映射），则推送到远程；
        // 注意: 这里的 ID 逻辑取决于具体实现，假设 id 是全局唯一的，
        // 如果本地有 ID 但远程没找到，可能是远程删除了，也可能是本地新增。
        // 为了简化，这里假设远程没找到即为本地新增
        plan.push({ type: SyncActionType.CREATE_REMOTE, item: localItem });
      } else {
        // 场景: 两边都有，比较时间戳
        const localTime = new Date(localItem.updatedAt).getTime();
        const remoteTime = new Date(remoteItem.updatedAt).getTime();

        if (localTime < remoteTime) {
          // 远程更新，同步到本地
          plan.push({ type: SyncActionType.UPDATE_LOCAL, item: remoteItem });
        } else if (localTime > remoteTime) {
          // 本地更新，推送到远程
          plan.push({ type: SyncActionType.UPDATE_REMOTE, item: localItem });
        }
      }
    }

    // 2. 处理远程有但本地没有的项
    for (const remoteItem of remoteItems) {
      if (!localMap.has(remoteItem.id)) {
        // 场景: 远程有但本地没有
        // 逻辑: 可能是远程新增，也可能是本地已删除。
        // 根据“远程优先”策略，这里将其视为本地需要新增（或恢复）
        plan.push({ type: SyncActionType.UPDATE_LOCAL, item: remoteItem });
      }
    }

    return plan;
  }
}
