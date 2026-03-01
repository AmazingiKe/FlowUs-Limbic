import { StorageAdapter } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * @class FileStorageAdapter
 * @description 用于 CLI 的文件存储适配器
 */
export class FileStorageAdapter implements StorageAdapter {
  private configPath: string;

  constructor(configDir: string) {
    this.configPath = path.join(configDir, 'config.json');
  }

  private async ensureFile() {
    try {
      await fs.access(this.configPath);
    } catch {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.writeFile(this.configPath, '{}');
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.ensureFile();
    const data = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
    return data[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.ensureFile();
    const data = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
    data[key] = value;
    await fs.writeFile(this.configPath, JSON.stringify(data, null, 2));
  }

  async removeItem(key: string): Promise<void> {
    await this.ensureFile();
    const data = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
    delete data[key];
    await fs.writeFile(this.configPath, JSON.stringify(data, null, 2));
  }
}
