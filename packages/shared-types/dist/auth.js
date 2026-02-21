"use strict";
/**
 * 认证相关类型定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthState = void 0;
/**
 * 认证状态
 */
var AuthState;
(function (AuthState) {
    AuthState["UNAUTHENTICATED"] = "UNAUTHENTICATED";
    AuthState["AUTHENTICATING"] = "AUTHENTICATING";
    AuthState["AUTHENTICATED"] = "AUTHENTICATED";
    AuthState["EXPIRED"] = "EXPIRED";
    AuthState["ERROR"] = "ERROR";
})(AuthState || (exports.AuthState = AuthState = {}));
