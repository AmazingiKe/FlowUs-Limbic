/**
 * 认证相关类型定义
 */
/**
 * 认证配置
 */
export interface AuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}
/**
 * Token 响应
 */
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}
/**
 * Token 信息
 */
export interface TokenInfo {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}
/**
 * 认证状态
 */
export declare enum AuthState {
    UNAUTHENTICATED = "UNAUTHENTICATED",
    AUTHENTICATING = "AUTHENTICATING",
    AUTHENTICATED = "AUTHENTICATED",
    EXPIRED = "EXPIRED",
    ERROR = "ERROR"
}
//# sourceMappingURL=auth.d.ts.map