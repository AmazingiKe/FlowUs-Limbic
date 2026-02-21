/**
 * 存储适配器接口
 */
/**
 * 存储适配器接口
 * 职责: 隔离不同环境（Node.js/Obsidian）的持久化逻辑
 */
export interface IStorageAdapter {
    /**
     * 获取存储的值
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * 设置存储的值
     */
    set<T>(key: string, value: T): Promise<void>;
    /**
     * 删除存储的值
     */
    remove(key: string): Promise<void>;
    /**
     * 获取所有键
     */
    getAllKeys?(): Promise<string[]>;
    /**
     * 清空所有存储
     */
    clear?(): Promise<void>;
}
/**
 * 存储选项
 */
export interface StorageOptions {
    namespace?: string;
    encrypt?: boolean;
}
//# sourceMappingURL=storage.d.ts.map