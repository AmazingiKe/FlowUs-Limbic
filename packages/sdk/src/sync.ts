import { FlowUsClient } from '../api/client';
import { StorageAdapter, TodoItem } from '../types';

/**
 * @class IncrementalSyncer
 * @description 增量同步核心实现
 */
export class IncrementalSyncer {
  constructor(
    private client: FlowUsClient,
    private storage: StorageAdapter
  ) {}

  /**
   * 执行增量同步
   */
  async sync(databaseId: string) {
    const lastSyncTimeStr = await this.storage.getItem('last_sync_time');
    const lastSyncTime = lastSyncTimeStr ? parseInt(lastSyncTimeStr, 10) : 0;

    // 1. 获取远程变更
    const remoteItems = await this.client.getPages(databaseId);

    let pulled = 0;
    let pushed = 0;

    for (const remoteItem of remoteItems) {
      const remoteUpdatedAt = new Date(remoteItem.updatedAt).getTime();

      if (remoteUpdatedAt > lastSyncTime) {
        // 执行同步逻辑（此处简化为记录数量，实际应更新本地缓存/Obsidian）
        pulled++;
      }
    }

    // 2. 更新同步时间戳
    await this.storage.setItem('last_sync_time', Date.now().toString());

    return { pulled, pushed };
  }
}
