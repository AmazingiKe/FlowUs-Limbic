## 问题
当前的OAuth流程使用`https://amazingike-flowus-libs.com`作为重定向URI，但这个地址无法访问，导致FlowUs授权后重定向时出现`ERR_TUNNEL_CONNECTION_FAILED`错误。

## 解决方案
实现一个本地回调机制，不依赖外部域名：

1. **更新`oauth.ts`中的OAuth流程**：
   - 将重定向URI改为`obsidian://flowus-limbic-callback`
   - 修改授权URL生成逻辑，使用这个本地URI

2. **在`main.ts`中添加URI处理器**：
   - 注册`obsidian://flowus-limbic-callback`的URI处理器
   - 从URI中提取授权码
   - 使用现有的OAuth方法将代码交换为令牌

3. **更新插件设置**：
   - 在设置中更新默认的重定向URI
   - 确保客户端ID和密钥配置正确

4. **测试修复**：
   - 构建更新后的插件
   - 测试授权流程，确保正常工作

这种方法将允许OAuth流程完全在Obsidian内部完成，消除对外部重定向URI的需求。