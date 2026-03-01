import express from 'express';

/**
 * OAuth 回调服务器配置
 */
export interface OAuthCallbackServerConfig {
  port: number;
  path: string;
  timeout?: number;
}

/**
 * OAuth 回调服务器
 */
export class OAuthCallbackServer {
  private app: express.Application;
  private server: any;
  private resolvePromise!: (code: string) => void;
  private rejectPromise!: (error: Error) => void;
  private timeoutTimer!: NodeJS.Timeout;

  constructor(private config: OAuthCallbackServerConfig = {
    port: 3000,
    path: '/callback',
    timeout: 60000
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
        console.log(`Callback server listening on port ${this.config.port}`);
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

      if (error) {
        this.rejectPromise(new Error(`Authorization failed: ${error}`));
        res.send(`Authorization failed: ${error}`);
        this.stop();
        return;
      }

      if (!code) {
        this.rejectPromise(new Error('No authorization code received'));
        res.send('No authorization code received');
        this.stop();
        return;
      }

      this.resolvePromise(code);
      res.send('Authorization successful! You can close this page.');
      this.stop();
    });

    // 健康检查
    this.app.get('/', (req, res) => {
      res.send('OAuth callback server is running');
    });
  }
}