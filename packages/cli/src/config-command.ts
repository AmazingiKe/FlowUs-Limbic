import { Command } from 'commander';
import inquirer from 'inquirer';
import { FileStorageAdapter } from '../../sdk/src/adapter';
import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';

/**
 * 配置管理命令
 */
export class ConfigCommand {
  private adapter: FileStorageAdapter;

  constructor() {
    const configDir = path.join(os.homedir(), '.flowus-kit');
    this.adapter = new FileStorageAdapter(configDir);
  }

  /**
   * 添加配置管理命令到程序
   */
  addCommand(program: Command): Command {
    const configCommand = program.command('config')
      .description('FlowUs 配置管理')
      .action(() => {
        console.log(chalk.yellow('使用 config 子命令来管理配置'));
        configCommand.help();
      });

    // 显示配置
    configCommand.command('list')
      .alias('ls')
      .description('列出所有配置项')
      .action(async () => {
        const config = await this.getConfig();
        console.log(chalk.cyan('Current configuration:'));
        console.log(JSON.stringify(config, null, 2));
      });

    // 获取配置项
    configCommand.command('get <key>')
      .description('获取配置项值')
      .action(async (key: string) => {
        const value = await this.adapter.getItem(key);
        console.log(value);
      });

    // 设置配置项
    configCommand.command('set <key> <value>')
      .description('设置配置项值')
      .action(async (key: string, value: string) => {
        await this.adapter.setItem(key, value);
        console.log(chalk.green(`Configuration '${key}' set to '${value}'`));
      });

    // 删除配置项
    configCommand.command('delete <key>')
      .alias('del')
      .description('删除配置项')
      .action(async (key: string) => {
        await this.adapter.removeItem(key);
        console.log(chalk.green(`Configuration '${key}' deleted`));
      });

    // 交互式配置
    configCommand.command('init')
      .description('交互式配置')
      .action(async () => {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'clientId',
            message: 'Enter Client ID:',
            default: await this.adapter.getItem('clientId') || ''
          },
          {
            type: 'input',
            name: 'clientSecret',
            message: 'Enter Client Secret:',
            default: await this.adapter.getItem('clientSecret') || ''
          }
        ]);

        await Promise.all([
          this.adapter.setItem('clientId', answers.clientId),
          this.adapter.setItem('clientSecret', answers.clientSecret)
        ]);

        console.log(chalk.green('Configuration saved!'));
      });

    return configCommand;
  }

  /**
   * 获取所有配置
   */
  private async getConfig(): Promise<Record<string, any>> {
    const keys = ['clientId', 'clientSecret', 'default_database_id'];
    const config: Record<string, any> = {};

    for (const key of keys) {
      const value = await this.adapter.getItem(key);
      if (value) {
        config[key] = value;
      }
    }

    return config;
  }
}