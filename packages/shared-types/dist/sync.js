"use strict";
/**
 * 同步相关类型定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictStrategy = exports.SyncState = exports.SyncActionType = void 0;
/**
 * 同步操作类型
 */
var SyncActionType;
(function (SyncActionType) {
    SyncActionType["CREATE_REMOTE"] = "CREATE_REMOTE";
    SyncActionType["UPDATE_REMOTE"] = "UPDATE_REMOTE";
    SyncActionType["UPDATE_LOCAL"] = "UPDATE_LOCAL";
    SyncActionType["DELETE_LOCAL"] = "DELETE_LOCAL";
    SyncActionType["DELETE_REMOTE"] = "DELETE_REMOTE";
    SyncActionType["NO_OP"] = "NO_OP"; // 无需操作
})(SyncActionType || (exports.SyncActionType = SyncActionType = {}));
/**
 * 同步状态
 */
var SyncState;
(function (SyncState) {
    SyncState["IDLE"] = "IDLE";
    SyncState["SYNCING"] = "SYNCING";
    SyncState["COMPLETED"] = "COMPLETED";
    SyncState["ERROR"] = "ERROR";
})(SyncState || (exports.SyncState = SyncState = {}));
/**
 * 冲突解决策略
 */
var ConflictStrategy;
(function (ConflictStrategy) {
    ConflictStrategy["REMOTE_WINS"] = "REMOTE_WINS";
    ConflictStrategy["LOCAL_WINS"] = "LOCAL_WINS";
    ConflictStrategy["TIMESTAMP"] = "TIMESTAMP";
    ConflictStrategy["MANUAL"] = "MANUAL"; // 手动选择
})(ConflictStrategy || (exports.ConflictStrategy = ConflictStrategy = {}));
