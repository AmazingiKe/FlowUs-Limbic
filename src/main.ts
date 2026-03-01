import { Plugin, App, PluginManifest, Notice } from 'obsidian';
import { FlowUsLimbicSettingTab } from './settings-tab';
import { FlowUsLimbicSettings, DEFAULT_SETTINGS } from './settings';
import { TodoView, TODO_VIEW_TYPE } from './ui/todo-view';
import { FlowUsOAuthManager } from './flowus/auth-manager';

export default class FlowUsLimbicPlugin extends Plugin {
    settings: FlowUsLimbicSettings;
    private authManager: FlowUsOAuthManager;
    private settingTab: FlowUsLimbicSettingTab | null = null;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = { ...DEFAULT_SETTINGS };
        this.authManager = new FlowUsOAuthManager(
            this.settings,
            this.saveTokens.bind(this)
        );
    }

    async onload() {
        console.log('FlowUs Limbic plugin loaded');

        await this.loadSettings();

        // 更新 auth manager 的设置
        this.authManager.updateSettings(this.settings);

        // 创建设置选项卡
        this.settingTab = new FlowUsLimbicSettingTab(this.app, this);
        this.settingTab.setAuthManager(this.authManager);
        this.addSettingTab(this.settingTab);

        // 注册 TODO 视图
        this.registerView(
            TODO_VIEW_TYPE,
            (leaf) => new TodoView(leaf, this, this.authManager)
        );

        // 添加打开 TODO 视图的命令
        this.addCommand({
            id: 'flowus-limbic-open-todo-view',
            name: '打开 TODO 视图',
            callback: () => {
                this.activateTodoView();
            }
        });

        // 添加左侧栏图标
        this.addRibbonIcon('flowus-todo', 'FlowUs TODO', (evt) => {
            this.activateTodoView();
        });
    }

    onunload() {
        console.log('FlowUs Limbic plugin unloaded');
        this.app.workspace.detachLeavesOfType(TODO_VIEW_TYPE);
    }

    async activateTodoView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(TODO_VIEW_TYPE)[0];

        if (!leaf) {
            leaf = workspace.getLeaf(false);
            await leaf.setViewState({
                type: TODO_VIEW_TYPE,
                active: true
            });
        }

        workspace.revealLeaf(leaf);

        // 更新视图的设置
        const view = leaf.view as TodoView;
        if (view && 'updateSettings' in view) {
            view.updateSettings();
        }
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

    async saveTokens(tokens: Partial<FlowUsLimbicSettings>): Promise<void> {
        console.log('saveTokens called with:', {
            hasAccessToken: !!tokens.accessToken,
            hasRefreshToken: !!tokens.refreshToken,
            tokenExpiry: tokens.tokenExpiry
        });
        this.settings = { ...this.settings, ...tokens };
        console.log('Settings after merge:', {
            hasAccessToken: !!this.settings.accessToken,
            hasRefreshToken: !!this.settings.refreshToken
        });
        await this.saveSettings();
        console.log('Settings saved!');
    }

    async handleOAuthCallback(params: any) {
        // 这个暂时保留，但我们现在使用本地服务器方式
        const { code, state } = params;
        if (!code) {
            console.error('OAuth callback: No code received');
            return;
        }

        console.log('OAuth callback received (obsidian:// protocol), but using localhost:3000 now');
    }
}