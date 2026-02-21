import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Authenticator } from '../../sdk/src/auth';
import { FlowUsClient } from '../../sdk/src/client';
import { FileStorageAdapter } from '../../sdk/src/adapter';
import * as os from 'os';
import * as path from 'path';

const program = new Command();
const configDir = path.join(os.homedir(), '.flowus-kit');
const adapter = new FileStorageAdapter(configDir);

// 辅助函数：显示加载动画
const withLoader = async (text: string, action: () => Promise<any>) => {
  const spinner = ora(text).start();
  try {
    const result = await action();
    spinner.succeed(chalk.green('操作成功'));
    return result;
  } catch (e: any) {
    spinner.fail(chalk.red(`操作失败: ${e.message}`));
    process.exit(1);
  }
};

program
  .name('flowus-kit')
  .description(chalk.cyan('FlowUs Kit Tools - 命令行同步工具'))
  .version('0.1.0');

program.command('login')
  .description('执行 FlowUs OAuth 授权并保存 Token')
  .action(async () => {
    const auth = new Authenticator({
      clientId: await adapter.getItem('clientId') || '',
      clientSecret: await adapter.getItem('clientSecret') || '',
      redirectUri: 'http://localhost:3000/callback'
    }, adapter);

    const authUrl = auth.getAuthorizationUrl();
    console.log(chalk.yellow('1. 请在浏览器中打开以下链接进行授权：'));
    console.log(chalk.blue.underline(authUrl));

    console.log(chalk.yellow('\n2. 授权完成后，浏览器会重定向到一个包含 code 参数的 URL。'));

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question(chalk.cyan('请输入 URL 中的 code: '), async (code: string) => {
      readline.close();
      if (!code) {
        console.error(chalk.red('错误: code 不能为空'));
        process.exit(1);
      }

      await withLoader('正在换取并保存 Token...', async () => {
        await auth.exchangeCode(code);
      });

      console.log(chalk.green('✔ 身份验证成功，Token 已保存！'));
    });
  });

program.command('todo-ls')
  .description('List todos from a database')
  .requiredOption('-d, --database <id>', 'Database ID')
  .action(async (options) => {
    const auth = new Authenticator({
        clientId: await adapter.getItem('clientId') || '',
        clientSecret: await adapter.getItem('clientSecret') || '',
        redirectUri: 'http://localhost:3000/callback'
    }, adapter);

    const client = new FlowUsClient(auth);
    try {
        const todos = await client.getPages(options.database);
        console.table(todos.map(t => ({ ID: t.id, Title: t.title, Done: t.completed })));
    } catch (e: any) {
        console.error('Error:', e.message);
    }
  });

program.command('todo-add')
  .description('向 FlowUs 数据库添加新任务')
  .argument('<title>', '任务标题')
  .option('-d, --database <id>', '数据库 ID (可选，默认使用配置)')
  .action(async (title, options) => {
    await withLoader(`正在添加任务: ${title}...`, async () => {
      const dbId = options.database || await adapter.getItem('default_database_id');
      if (!dbId) {
        throw new Error('未指定数据库 ID，请使用 -d 参数或在配置中设置 default_database_id');
      }

      const auth = new Authenticator({
        clientId: await adapter.getItem('clientId') || '',
        clientSecret: await adapter.getItem('clientSecret') || '',
        redirectUri: 'http://localhost:3000/callback'
      }, adapter);

      const client = new FlowUsClient(auth);

      const properties = {
        title: {
          type: 'title',
          title: [{ text: { content: title } }]
        },
        completed: {
          type: 'checkbox',
          checkbox: false
        }
      };

      const newTodo = await client.createPage(dbId, properties);
      console.log('\n' + chalk.green('✔ 任务创建成功!'));
      console.log(`${chalk.bold('ID:')} ${newTodo.id}`);
      console.log(`${chalk.bold('标题:')} ${newTodo.title}`);
    });
  });

program.parse();

