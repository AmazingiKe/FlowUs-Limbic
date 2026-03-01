import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type { FlowUsLimbicSettings } from './settings';
import { DEFAULT_SETTINGS } from './settings';

export class FlowUsLimbicSettingTab extends PluginSettingTab {
    private plugin: any;

    constructor(app: App, plugin: any) {
        super(app, plugin);
        this.plugin = plugin;
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

        const authStatus = containerEl.createEl('div');
        this.updateAuthStatus(authStatus);

        new Setting(containerEl)
            .setName('一键授权')
            .setDesc('点击按钮打开 FlowUs 授权页面')
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
                        this.plugin.settings.accessToken = '';
                        this.plugin.settings.refreshToken = '';
                        this.plugin.settings.tokenExpiry = 0;
                        await this.plugin.saveSettings();
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
        } else {
            const status = element.createEl('div', {
                cls: 'flowus-auth-status warning',
                text: '⚠️ 未授权'
            });
            status.style.color = 'var(--color-yellow)';
            status.style.marginBottom = '16px';
        }
    }

    private handleAuthorize(): void {
        if (!this.plugin.settings.clientId || !this.plugin.settings.clientSecret) {
            new Notice('请先填写 Client ID 和 Client Secret');
            return;
        }

        const state = Math.random().toString(36).substring(2, 15);
        const params = new URLSearchParams({
            client_id: this.plugin.settings.clientId,
            response_type: 'code',
            redirect_uri: 'obsidian://flowus-limbic-callback',
            scope: 'all',
            state: state
        });

        const authUrl = `https://api.flowus.cn/oauth/authorize?${params.toString()}`;
        window.open(authUrl, '_blank');

        new Notice('已打开授权页面，请在浏览器中完成授权');
    }
}