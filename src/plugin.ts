import { Plugin, App, PluginManifest } from 'obsidian';

export class FlowUsLimbicPlugin extends Plugin {
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
    }

    async onload() {
        console.log('FlowUs Limbic plugin loaded');
    }

    onunload() {
        console.log('FlowUs Limbic plugin unloaded');
    }
}

export default FlowUsLimbicPlugin;
