import open from 'open';
import { Authenticator } from '../../sdk/src/auth';
import { FileStorageAdapter } from '../../sdk/src/adapter';
import { OAuthCallbackServer } from './oauth-server';
import { DatabaseSelector } from './database-selector';
import chalk from 'chalk';
import { Database } from '../../sdk/src/types';

/**
 * 一键授权管理器
 */
export class OneClickAuth {
  private adapter: FileStorageAdapter;

  constructor(private configDir: string) {
    this.adapter = new FileStorageAdapter(configDir);
  }

  /**
   * 执行一键授权流程
   */
  async run(): Promise<{ accessToken: string; database?: Database }> {
    // 检查是否已配置
    const clientId = await this.adapter.getItem('clientId') || '';
    const clientSecret = await this.adapter.getItem('clientSecret') || '';

    if (!clientId || !clientSecret) {
      throw new Error('Client ID or Client Secret not configured. Please run "flowus-kit config init" first.');
    }

    // 创建授权服务器
    const server = new OAuthCallbackServer({
      port: 3000,
      path: '/callback',
      timeout: 60000
    });

    // 创建认证器
    const authenticator = new Authenticator({
      clientId,
      clientSecret,
      redirectUri: 'http://localhost:3000/callback'
    }, this.adapter);

    try {
      // 启动服务器
      const authCodePromise = server.start();

      // 打开授权页面
      const authUrl = authenticator.getAuthorizationUrl();
      console.log(chalk.yellow('Opening authorization page in browser...'));
      await open(authUrl);

      console.log(chalk.cyan('Please authorize the application in your browser.'));

      // 等待授权码
      const authCode = await authCodePromise;
      console.log(chalk.green('Authorization code received!'));

      // 换取令牌
      console.log(chalk.cyan('Exchanging authorization code for token...'));
      await authenticator.exchangeCode(authCode);

      console.log(chalk.green('✓ Authentication successful!'));

      // 选择数据库
      const databaseSelector = new DatabaseSelector(authenticator);
      const selectedDatabase = await databaseSelector.select();

      if (selectedDatabase) {
        console.log(chalk.green(`✓ Selected database: ${selectedDatabase.title}`));
        // 保存为默认数据库
        await this.adapter.setItem('default_database_id', selectedDatabase.id);
      } else {
        console.log(chalk.yellow('⚠ No database selected'));
      }

      return {
        accessToken: (await authenticator.getAccessToken()) as string,
        database: selectedDatabase || undefined
      };
    } catch (error) {
      server.stop();
      throw error;
    }
  }
}