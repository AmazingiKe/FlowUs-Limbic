import { Plugin } from (window as any).obsidian || (global as any).obsidian;

export class FlowUsLimbicPlugin extends Plugin {
    async onload() {
        console.log('FlowUs Limbic plugin loaded');
    }

    onunload() {
        console.log('FlowUs Limbic plugin unloaded');
    }
}

export function createPlugin() {
    return new FlowUsLimbicPlugin();
}
