# 构建系统

本文档介绍 FlowUs Limbic 的构建系统配置和工作原理。

## 构建工具

FlowUs Limbic 使用 **esbuild** 作为主要构建工具，原因如下：

- **极快的构建速度**: 使用 Go 编写，比 Webpack/Rollup 快 10-100 倍
- **内置 TypeScript 支持**: 无需额外配置
- **简单的 API**: 易于配置和扩展
- **Obsidian 生态标准**: 大多数 Obsidian 插件使用 esbuild

## 配置文件

### esbuild.config.mjs

主构建配置文件：

```javascript
import esbuild from 'esbuild';
import { build } from './build/esbuild.base.mjs';

const context = await esbuild.context({
  ...build,
  entryPoints: ['src/main.ts'],
  outfile: 'main.js',
});

if (process.argv.includes('--dev')) {
  await context.watch();
  console.log('Watching for changes...');
} else {
  await context.rebuild();
  await context.dispose();
  console.log('Build complete');
}
```

### build/esbuild.base.mjs

基础配置，包含共享配置：

```javascript
import process from 'process';

export const build = {
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'es2016',
  logLevel: 'info',
  sourcemap: process.argv.includes('--dev') ? 'inline' : false,
  treeShaking: true,
  minify: !process.argv.includes('--dev'),
  define: {
    'process.env.NODE_ENV': process.argv.includes('--dev')
      ? '"development"'
      : '"production"',
  },
};
```

## npm 脚本

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs --dev",
    "build": "node esbuild.config.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

### 脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式，监听文件变化 |
| `npm run build` | 生产构建，压缩代码 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 运行测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

## 开发模式

### 监听模式

```bash
npm run dev
```

这会：
- 启动 esbuild 的监听模式
- 文件变更时自动重新构建
- 生成 inline sourcemap，便于调试
- 不压缩代码，保持可读性

### 热重载

Obsidian 插件不能真正热重载，但可以：

1. 修改代码后保存
2. esbuild 自动重新构建
3. 在 Obsidian 中禁用再启用插件
4. 或使用 Obsidian 的"重新加载插件"命令

## 生产构建

```bash
npm run build
```

这会：
- 压缩代码（tree shaking + minify）
- 不生成 sourcemap
- 优化代码体积
- 设置 `NODE_ENV=production`

### 构建输出

```
FlowUs-Limbic/
├── main.js          # 构建输出（CommonJS）
├── manifest.json    # 插件清单（复制）
└── styles.css       # 样式文件（如果有）
```

## TypeScript 配置

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2016",
    "module": "CommonJS",
    "lib": ["ES2016", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 关键配置说明

| 配置 | 说明 |
|------|------|
| `target: "ES2016"` | 兼容 Obsidian 的最低要求 |
| `module: "CommonJS"` | Obsidian 使用 CommonJS |
| `strict: true` | 启用严格模式 |
| `experimentalDecorators: true` | 支持 tsyringe DI |
| `emitDecoratorMetadata: true` | 支持 tsyringe DI |
| `noEmit: true` | esbuild 负责编译，tsc 只做类型检查 |

## 依赖注入

项目使用 `tsyringe` 进行依赖注入：

```typescript
// src/main.ts
import 'reflect-metadata';
import { container } from 'tsyringe';

// 注册依赖
container.registerSingleton('IStorageAdapter', ObsidianStorageAdapter);
container.registerSingleton('FlowUsAdapter', FlowUsAdapter);
```

## 依赖处理

### external 配置

esbuild 配置中标记 `obsidian` 为 external：

```javascript
external: ['obsidian']
```

这意味着：
- esbuild 不会打包 obsidian 模块
- 运行时由 Obsidian 提供
- 减小插件体积

### 其他依赖

其他依赖（axios、tsyringe 等）会被打包进 main.js：

```
main.js (包含所有依赖)
├── axios
├── tsyringe
├── reflect-metadata
└── ...
```

## 优化

### Tree Shaking

esbuild 自动启用 tree shaking：

```javascript
treeShaking: true
```

这会移除未使用的代码，减小体积。

### 代码压缩

生产构建启用压缩：

```javascript
minify: true
```

### 按需导入

使用按需导入而不是全量导入：

```typescript
// 好
import { debounce } from 'lodash-es';

// 不好
import _ from 'lodash';
```

## 调试

### Source Maps

开发模式生成 inline source map：

```javascript
sourcemap: 'inline'
```

这让您可以在 Obsidian 控制台中调试原始 TypeScript 代码。

### 调试构建问题

如果构建失败：

1. 检查 TypeScript 错误：`npm run typecheck`
2. 查看 esbuild 输出日志
3. 检查是否有循环依赖
4. 尝试删除 node_modules 重新安装

## CI/CD

### GitHub Actions 示例

```yaml
name: Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: plugin
          path: |
            main.js
            manifest.json
```

## 发布流程

### 版本发布

```bash
# 1. 更新版本号
npm version patch  # 或 minor/major

# 2. 构建
npm run build

# 3. 创建 ZIP
zip -r flowus-limbic-v1.0.0.zip main.js manifest.json

# 4. 创建 GitHub Release
# 上传 ZIP 文件
```

## 常见问题

### Q: 构建太慢？

**A**:
- esbuild 已经很快了，如果还慢：
  - 检查是否有太多依赖
  - 检查是否有循环依赖
  - 使用 `--log-level=debug` 查看详情

### Q: 构建成功但运行时报错？

**A**:
- 检查是否正确标记了 external
- 检查 TypeScript 类型检查
- 查看 Obsidian 控制台错误

### Q: 如何添加样式？

**A**:
1. 创建 `styles.css`
2. 在 `manifest.json` 中添加 `"css": "styles.css"`
3. esbuild 可以配置处理 CSS（可选）

## 下一步

- [开发环境搭建](./environment-setup.md) - 搭建开发环境
- [测试指南](./testing-guidelines.md) - 学习如何测试
