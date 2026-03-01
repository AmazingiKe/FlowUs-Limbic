/**
 * OAuth 回调服务器（用于 Obsidian 插件）
 * 参考 CLI 中的实现
 */

import express from 'express';

export interface OAuthCallbackServerConfig {
  port: number;
  path: string;
  timeout?: number;
}

export class OAuthCallbackServer {
  private app: express.Application;
  private server: any;
  private resolvePromise!: (code: string) => void;
  private rejectPromise!: (error: Error) => void;
  private timeoutTimer!: NodeJS.Timeout;

  constructor(private config: OAuthCallbackServerConfig = {
    port: 3000,
    path: '/callback',
    timeout: 120000 // 2 分钟超时
  }) {
    this.app = express();
    this.setupRoutes();
  }

  /**
   * 启动服务器并等待授权回调
   */
  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // 设置超时
      this.timeoutTimer = setTimeout(() => {
        this.stop();
        reject(new Error('Authorization timeout'));
      }, this.config.timeout);

      // 启动服务器
      this.server = this.app.listen(this.config.port, () => {
        console.log(`OAuth callback server listening on port ${this.config.port}`);
        console.log(`Callback URL: http://localhost:${this.config.port}${this.config.path}`);
      });

      this.server.on('error', (err: Error) => {
        this.stop();
        reject(err);
      });
    });
  }

  /**
   * 停止服务器
   */
  stop(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    if (this.server) {
      this.server.close();
    }
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 处理回调
    this.app.get(this.config.path, (req, res) => {
      const code = req.query.code as string;
      const error = req.query.error as string;
      const state = req.query.state as string;

      if (error) {
        this.rejectPromise(new Error(`Authorization failed: ${error}`));
        res.send(`
          <html>
            <body style="font-family: system-ui; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">授权失败</h1>
              <p>${error}</p>
              <p>您可以关闭此页面了。</p>
            </body>
          </html>
        `);
        this.stop();
        return;
      }

      if (!code) {
        this.rejectPromise(new Error('No authorization code received'));
        res.send(`
          <html>
            <body style="font-family: system-ui; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">授权失败</h1>
              <p>未收到授权码</p>
              <p>您可以关闭此页面了。</p>
            </body>
          </html>
        `);
        this.stop();
        return;
      }

      this.resolvePromise(code);
      res.send(`
        <html>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1 style="color: #16a34a;">✅ 授权成功！</h1>
            <p>您可以关闭此页面，返回 Obsidian 了。</p>
          </body>
        </html>
      `);
      this.stop();
    });

    // 健康检查
    this.app.get('/', (req, res) => {
      res.send('OAuth callback server is running for FlowUs Limbic');
    });
  }
}
