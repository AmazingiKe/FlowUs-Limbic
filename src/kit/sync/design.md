# 增量同步算法设计 (基于 updatedAt)

## 1. 核心思路
通过比较本地记录与远程 FlowUs 数据库条目的 `updatedAt` 时间戳，确定同步方向（拉取远程或推送本地）。

## 2. 状态定义
- `LocalState`: 存储在本地适配器中的记录快照。
- `RemoteState`: 直接从 FlowUs API 获取的最新数据。

## 3. 同步逻辑流程
1. **获取基准**: 从 `StorageAdapter` 读取上一次成功同步的时间戳 `lastSyncTime`。
2. **拉取变更**: 请求远程 API，获取 `last_edited_time > lastSyncTime` 的所有页面。
3. **冲突处理**:
    - 如果远程记录的 `updatedAt` > 本地对应记录的 `updatedAt` -> **执行 Pull (拉取)**。
    - 如果本地存在未同步的修改 -> **执行 Push (推送)**。
    - 无法确定时，以远程为准 (Remote Wins)。
4. **更新状态**: 同步成功后，将最新的时间戳写回 `StorageAdapter` 的 `lastSyncTime`。

## 4. 关键接口
```typescript
interface SyncResult {
    pulled: number;
    pushed: number;
    errors: string[];
}
```
