import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Authenticator } from '../../sdk/src/auth';
import { FlowUsClient } from '../../sdk/src/client';
import { FileStorageAdapter } from '../../sdk/src/adapter';
import { OneClickAuth } from './one-click-auth';
import { ConfigCommand } from './config-command';
import { DatabaseSelector } from './database-selector';
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

// 配置管理命令
const configCommand = new ConfigCommand();
configCommand.addCommand(program);

// 一键授权命令
program.command('login')
  .description('执行 FlowUs OAuth 授权并保存 Token，支持一键授权')
  .option('--no-db', 'Skip database selection')
  .action(async (options: any) => {
    await withLoader('正在执行一键授权...', async () => {
      const auth = new OneClickAuth(configDir);
      await auth.run();
    });
  });

// 数据库选择命令
program.command('db-select')
  .description('选择默认数据库')
  .action(async () => {
    await withLoader('正在获取数据库列表...', async () => {
      const auth = new Authenticator({
        clientId: await adapter.getItem('clientId') || '',
        clientSecret: await adapter.getItem('clientSecret') || '',
        redirectUri: 'http://localhost:3000/callback'
      }, adapter);

      const selector = new DatabaseSelector(auth);
      const selectedDatabase = await selector.select();
      if (selectedDatabase) {
        await adapter.setItem('default_database_id', selectedDatabase.id);
        console.log(chalk.green(`✓ Default database set to: ${selectedDatabase.title}`));
      }
    });
  });

// 列出数据库
program.command('db-ls')
  .description('列出所有数据库')
  .action(async () => {
    await withLoader('正在获取数据库列表...', async () => {
      const auth = new Authenticator({
        clientId: await adapter.getItem('clientId') || '',
        clientSecret: await adapter.getItem('clientSecret') || '',
        redirectUri: 'http://localhost:3000/callback'
      }, adapter);

      const selector = new DatabaseSelector(auth);
      await selector.list();
    });
  });

// TODO 列表命令
program.command('todo-ls')
  .description('List todos from a database')
  .requiredOption('-d, --database <id>', 'Database ID')
  .action(async (options: any) => {
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

// 添加 TODO 命令
program.command('todo-add')
  .description('向 FlowUs 数据库添加新任务')
  .argument('<title>', '任务标题')
  .option('-d, --database <id>', '数据库 ID (可选，默认使用配置)')
  .action(async (title: string, options: any) => {
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