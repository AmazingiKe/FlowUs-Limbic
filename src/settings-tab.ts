import { App, PluginSettingTab, Setting } from 'obsidian';
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

        new Setting(containerEl)
            .setName('授权状态')
            .setDesc('当前授权状态')
            .addButton(button => button
                .setButtonText('授权')
                .onClick(() => {
                    this.handleAuthorize();
                }));
    }

    private handleAuthorize(): void {
        if (!this.plugin.settings.clientId || !this.plugin.settings.clientSecret) {
            this.plugin.app.vault.adapter.write('.flowus-limbic-error.log', 
                '错误：请先填写 Client ID 和 Client Secret\n');
            return;
        }

        const authUrl = `https://api.flowus.cn/oauth/authorize?client_id=${this.plugin.settings.clientId}&response_type=code&redirect_uri=obsidian://flowus-limbic-callback&scope=all&state=${Math.random().toString(36).substring(2, 15)}`;
        window.open(authUrl, '_blank');
    }
}
