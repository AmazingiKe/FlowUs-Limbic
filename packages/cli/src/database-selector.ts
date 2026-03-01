import inquirer from 'inquirer';
import { FlowUsClient } from '../../sdk/src/client';
import { Authenticator } from '../../sdk/src/auth';
import { FileStorageAdapter } from '../../sdk/src/adapter';
import { Database } from '../../sdk/src/types';

/**
 * 数据库选择向导
 */
export class DatabaseSelector {
  private client: FlowUsClient;

  constructor(
    private authenticator: Authenticator
  ) {
    this.client = new FlowUsClient(authenticator);
  }

  /**
   * 显示数据库选择向导
   */
  async select(): Promise<Database | null> {
    // 获取数据库列表
    const databases = await this.getDatabases();

    if (databases.length === 0) {
      console.log('No databases found');
      return null;
    }

    // 显示选择菜单
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Select a database:',
        choices: databases.map(db => ({
          name: `${db.title} ${db.description ? `(${db.description})` : ''}`,
          value: db
        }))
      },
      {
        type: 'confirm',
        name: 'setDefault',
        message: 'Set as default database?',
        default: true
      }
    ]);

    return answers.database;
  }

  /**
   * 获取用户的数据库列表
   */
  private async getDatabases(): Promise<Database[]> {
    try {
      return await this.client.getDatabases();
    } catch (error) {
      console.error('Failed to get databases:', error);
      return [];
    }
  }

  /**
   * 显示所有数据库列表（用于列表显示）
   */
  async list(): Promise<void> {
    const databases = await this.getDatabases();

    if (databases.length === 0) {
      console.log('No databases found');
      return;
    }

    console.log('Databases:');
    databases.forEach((db, index) => {
      console.log(`${index + 1}. ${db.title}`);
      if (db.description) {
        console.log(`   ${db.description}`);
      }
      console.log(`   ID: ${db.id}`);
    });
  }
}