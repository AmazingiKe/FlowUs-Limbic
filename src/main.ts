import { Plugin, App, PluginManifest } from 'obsidian';
import { FlowUsLimbicSettingTab } from './settings-tab';
import { FlowUsLimbicSettings, DEFAULT_SETTINGS } from './settings';

export default class FlowUsLimbicPlugin extends Plugin {
    settings: FlowUsLimbicSettings;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = { ...DEFAULT_SETTINGS };
    }

    async onload() {
        console.log('FlowUs Limbic plugin loaded');

        await this.loadSettings();

        this.addSettingTab(new FlowUsLimbicSettingTab(this.app, this));

        // 注册 Obsidian URI 回调
        this.registerObsidianProtocolHandler('flowus-limbic-callback', async (params) => {
            await this.handleOAuthCallback(params);
        });
    }

    onunload() {
        console.log('FlowUs Limbic plugin unloaded');
    }

    async loadSettings() {
        try {
            const savedSettings = await this.loadData();
            if (savedSettings) {
                this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            await this.saveData(this.settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async handleOAuthCallback(params: any) {
        const { code, state } = params;
        if (!code) {
            console.error('OAuth callback: No code received');
            return;
        }

        console.log('OAuth callback received, exchanging code for token...');

        // 这里实现换取 token 的逻辑
        // 暂时只显示一个通知
        new (require('obsidian').Notice)('授权成功！正在处理...');
    }
}