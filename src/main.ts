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
}
