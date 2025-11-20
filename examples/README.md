# TaskForge Examples

本目录包含各种使用场景的示例代码和测试用例。

## 📁 目录结构

```
examples/
├── tasks/              # 示例任务描述（输入）
│   ├── web-app.txt
│   ├── e-commerce.txt
│   ├── mobile-app.txt
│   └── data-pipeline.txt
├── scripts/            # 示例代码
│   ├── 01-basic-evaluation.mjs
│   ├── 02-auto-optimize.mjs
│   ├── 03-custom-weights.mjs
│   └── 04-batch-process.mjs
└── README.md
```

## 🚀 快速开始

### 前置要求

1. **配置环境变量**
   ```bash
   # 在项目根目录创建 .env 文件
   cd ../..  # 回到项目根目录
   cp .env.example .env
   # 编辑 .env 文件，填入您的 API keys
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

### 运行示例

1. 基础评估

评估一个预定义的任务树：

```bash
cd examples/scripts
node 01-basic-evaluation.mjs
```

### 2. 自动优化

从自然语言生成任务树并自动优化：

```bash
node 02-auto-optimize.mjs
```

### 3. 自定义权重

调整评分指标的权重：

```bash
node 03-custom-weights.mjs
```

### 4. 批量处理

批量处理多个任务：

```bash
node 04-batch-process.mjs
```

## 📝 示例任务说明

### 1. `web-app.txt` - Web 应用开发
- **复杂度**: 中等
- **层级**: 3 层
- **适合测试**: 基础功能、TDQ 评分

### 2. `e-commerce.txt` - 电商平台
- **复杂度**: 高
- **层级**: 4 层
- **适合测试**: 自动优化、粒度评估

### 3. `mobile-app.txt` - 移动应用
- **复杂度**: 中等
- **层级**: 3 层
- **适合测试**: 冗余检测、可执行性

### 4. `data-pipeline.txt` - 数据管道
- **复杂度**: 低
- **层级**: 2 层
- **适合测试**: 层级一致性、平衡性

## 💡 使用技巧

### 修改配置

所有示例脚本都可以通过修改配置参数来调整行为：

```javascript
const config = {
  maxIterations: 5,      // 最大迭代次数
  targetTDQ: 0.75,       // 目标 TDQ 分数
  verbose: true          // 显示详细日志
};
```

### 切换 LLM Provider

确保您的 `.env` 文件已正确配置：

```env
LLM_PROVIDER=custom
CUSTOM_API_KEY=your-key
CUSTOM_BASE_URL=https://api.deepseek.com
CUSTOM_MODEL=deepseek-chat
```

## 📊 预期输出

每个示例都会生成：
- 控制台日志（优化过程）
- JSON 文件（任务树）
- Markdown 报告（包含 TDQ 分析）

输出文件位于项目根目录，格式：`output_*.json` 和 `output_*.md`

## 🎯 学习路径

建议按以下顺序学习：

1. **01-basic-evaluation** - 了解基础评估流程
2. **02-auto-optimize** - 体验自动优化
3. **03-custom-weights** - 理解指标权重的影响
4. **04-batch-process** - 掌握批量处理

## 🔧 故障排除

### 问题: "Environment variable XXX is required"
**解决**: 检查 `.env` 文件是否正确配置

### 问题: "LLM did not return valid JSON"
**解决**: 尝试更换 LLM 模型或调整 prompt

### 问题: Embedding 模型下载慢
**解决**: 首次运行会下载约 23MB 模型，请耐心等待
