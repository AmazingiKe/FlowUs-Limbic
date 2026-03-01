import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type { FlowUsLimbicSettings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type { FlowUsOAuthManager } from './flowus/auth-manager';

export class FlowUsLimbicSettingTab extends PluginSettingTab {
    private plugin: any;
    private authManager: FlowUsOAuthManager | null = null;

    constructor(app: App, plugin: any) {
        super(app, plugin);
        this.plugin = plugin;
    }

    setAuthManager(authManager: FlowUsOAuthManager): void {
        this.authManager = authManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'FlowUs Limbic 设置' });

        new Setting(containerEl)
            .setName('Client ID')
            .setDesc('从 FlowUs 开发者平台获取的 Client ID')
            .addText(text => text
                .setPlaceholder('输入 Client ID')
                .setValue(this.plugin.settings.clientId)
                .onChange(async (value: string) => {
                    this.plugin.settings.clientId = value;
                    await this.plugin.saveSettings();
                    this.authManager?.updateSettings(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Client Secret')
            .setDesc('从 FlowUs 开发者平台获取的 Client Secret')
            .addText(text => text
                .setPlaceholder('输入 Client Secret')
                .setValue(this.plugin.settings.clientSecret)
                .onChange(async (value: string) => {
                    this.plugin.settings.clientSecret = value;
                    await this.plugin.saveSettings();
                    this.authManager?.updateSettings(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Database ID')
            .setDesc('FlowUs 数据库的 ID')
            .addText(text => text
                .setPlaceholder('输入 Database ID')
                .setValue(this.plugin.settings.databaseId)
                .onChange(async (value: string) => {
                    this.plugin.settings.databaseId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Table Name')
            .setDesc('数据库表名')
            .addText(text => text
                .setPlaceholder('输入表名')
                .setValue(this.plugin.settings.tableName)
                .onChange(async (value: string) => {
                    this.plugin.settings.tableName = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: '授权' });

        // 回调 URL 提示
        const callbackHint = containerEl.createEl('div', {
            cls: 'setting-item-description',
            text: '请在 FlowUs 开发者平台配置回调 URL: http://localhost:3000/callback'
        });
        callbackHint.style.color = 'var(--text-accent)';
        callbackHint.style.marginBottom = '16px';

        const authStatus = containerEl.createEl('div');
        this.updateAuthStatus(authStatus);

        new Setting(containerEl)
            .setName('一键授权')
            .setDesc('点击按钮打开 FlowUs 授权页面（使用本地服务器回调）')
            .addButton(button => button
                .setButtonText('🔗 一键授权')
                .setCta()
                .onClick(() => {
                    this.handleAuthorize();
                }));

        if (this.plugin.settings.accessToken) {
            new Setting(containerEl)
                .setName('清除授权')
                .setDesc('清除当前的访问令牌')
                .addButton(button => button
                    .setButtonText('清除授权')
                    .setWarning()
                    .onClick(async () => {
                        await this.authManager?.clearAuthorization();
                        this.updateAuthStatus(authStatus);
                        new Notice('授权已清除');
                        this.display();
                    }));
        }
    }

    private updateAuthStatus(element: HTMLElement): void {
        element.empty();
        if (this.plugin.settings.accessToken) {
            const status = element.createEl('div', {
                cls: 'flowus-auth-status success',
                text: '✅ 已授权'
            });
            status.style.color = 'var(--color-green)';
            status.style.marginBottom = '16px';

            // 显示令牌过期时间
            if (this.plugin.settings.tokenExpiry) {
                const expiry = new Date(this.plugin.settings.tokenExpiry);
                const expiryInfo = element.createEl('div', {
                    cls: 'setting-item-description',
                    text: `令牌过期时间: ${expiry.toLocaleString('zh-CN')}`
                });
                expiryInfo.style.marginBottom = '16px';
            }
        } else {
            const status = element.createEl('div', {
                cls: 'flowus-auth-status warning',
                text: '⚠️ 未授权'
            });
            status.style.color = 'var(--color-yellow)';
            status.style.marginBottom = '16px';
        }
    }

    private async handleAuthorize(): Promise<void> {
        if (!this.authManager) {
            new Notice('Auth manager not initialized');
            return;
        }

        await this.authManager.startAuthorization();

        // 更新显示
        this.display();
    }
}
