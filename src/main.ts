// 使用全局的obsidian对象，避免import语句
const { Plugin } = (window as any).obsidian || (global as any).obsidian;

class FlowUsLimbicPlugin extends Plugin {
  async onload() {
    console.log('FlowUs Limbic plugin loaded');
  }

  onunload() {
    console.log('FlowUs Limbic plugin unloaded');
  }
}

// 导出插件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowUsLimbicPlugin;
} else if (typeof window !== 'undefined') {
  (window as any).FlowUsLimbicPlugin = FlowUsLimbicPlugin;
} else if (typeof global !== 'undefined') {
  (global as any).FlowUsLimbicPlugin = FlowUsLimbicPlugin;
}