# TaskForge

**智能任务拆解质量评估与自动优化系统**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)

TaskForge 使用大语言模型 (LLM) 自动将复杂任务拆解为结构化任务树，通过 6 个维度的质量指标进行评估，并自动迭代优化直到达到最优质量。

---

## ✨ 核心特性

### 🎯 智能任务生成
- 从自然语言自动生成任务树
- LLM 驱动的 2-3 层结构化拆解
- 自动估计工时、优先级和依赖关系

### 📊 多维质量评估
- **结构指标**: 无环性、层级一致性、平衡性
- **语义指标**: 冗余度、粒度合理性、可执行性
- **TDQ 综合评分**: 加权整合 6 个指标

### 🔄 自动优化循环
```
生成任务树 → 评估质量 → 识别问题 → LLM 改进 → 重新评估 → 循环优化
```

### 🌐 多 LLM 支持
- OpenAI (GPT-4, GPT-4o)
- Anthropic Claude (3.5 Sonnet)
- Google Gemini (2.0 Flash)
- Ollama (本地模型)
- 自定义 (OpenAI 兼容 API)

### � 本地 Embedding
- **Transformers.js** 本地运行
- 无需 API key，完全免费
- 默认模型：`Xenova/all-MiniLM-L6-v2` (23MB)

---

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/lichman0405/taskforge.git
cd taskforge
npm install
```

### 配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置您的 LLM provider：

```env
# 示例: 使用 DeepSeek + 本地 Embedding
LLM_PROVIDER=custom
CUSTOM_API_KEY=sk-...
CUSTOM_BASE_URL=https://api.deepseek.com
CUSTOM_MODEL=deepseek-chat

EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

### 构建

```bash
npm run build
```

### 运行 Demo

```bash
# 1. 结构指标测试
npm run demo:structural

# 2. 语义指标测试
npm run demo:semantic

# 3. 自动优化 (完整流程)
npm run demo:optimize
```

---

## 📦 作为库使用

您可以将 TaskForge 作为依赖安装到您的项目中：

### 安装

```bash
npm install git+https://github.com/lichman0405/taskforge.git
```

### 代码集成

```javascript
import { 
  optimizeTaskDecomposition, 
  createLLMClient, 
  createEmbeddingClient 
} from 'taskforge';
import 'dotenv/config'; // 确保加载环境变量

// 1. 配置客户端
const llmClient = createLLMClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini'
});

const embeddingClient = createEmbeddingClient({
  provider: 'local',
  model: 'Xenova/all-MiniLM-L6-v2'
});

// 2. 运行优化
const result = await optimizeTaskDecomposition(
  "创建一个在线教育平台",
  llmClient,
  embeddingClient,
  {
    maxIterations: 3,
    targetTDQ: 0.75
  }
);

```

---

## 📖 源码开发示例

### 基础用法

```javascript
import { optimizeTaskDecomposition } from './dist/service/taskService.js';
import { createLLMClient, createEmbeddingClient } from './dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from './dist/core/config.js';

const llmClient = createLLMClient(getLLMConfig());
const embeddingClient = createEmbeddingClient(getEmbeddingConfig());

// 自动优化任务拆解
const result = await optimizeTaskDecomposition(
  "创建一个在线教育平台，支持视频课程、在线测验和学生管理",
  llmClient,
  embeddingClient,
  {
    maxIterations: 5,
    targetTDQ: 0.75,
    verbose: true
  }
);

console.log(`最终 TDQ: ${result.finalTDQ.score}`);
console.log(`迭代次数: ${result.iterations}`);
```

### 导出结果

```javascript
import { saveTaskTree } from './dist/core/export.js';

// 保存为 JSON
await saveTaskTree(result.finalTree, 'output.json', 'json');

// 保存为 Markdown (包含评估报告)
await saveTaskTree(result.finalTree, 'output.md', 'markdown', result.finalTDQ);
```

---

## 📊 评分指标

TaskForge 使用 6 个维度评估任务拆解质量：

| 指标 | 权重 | 说明 |
|------|------|------|
| **Acyclicity (A)** | 0.10 | 检测任务依赖是否存在循环 |
| **Hierarchy (H)** | 0.15 | 评估层级结构的一致性 |
| **Balance (B)** | 0.10 | 评估子任务分布的平衡性 |
| **Granularity (G)** | 0.20 | 评估任务粒度是否合理 (1-8h) |
| **Redundancy (R)** | 0.10 | 检测重复任务 (基于 Embedding) |
| **Executability (E)** | 0.25 | 评估任务描述的可执行性 |

**TDQ 综合评分** = Σ(指标 × 权重)

---

## 🛠️ 技术栈

- **语言**: TypeScript (ES Modules)
- **运行时**: Node.js v24+
- **LLM SDK**:
  - `openai`: OpenAI API
  - `@anthropic-ai/sdk`: Claude API
  - `@google/generative-ai`: Gemini API
  - `ollama`: Ollama 本地模型
- **Embedding**: `@xenova/transformers` (本地)
- **配置**: `dotenv`

---

## 📁 项目结构

```
TaskForge/
├── src/
│   ├── core/           # 核心数据结构与配置
│   ├── metrics/        # 评估指标实现
│   ├── llm/            # LLM 抽象层
│   └── service/        # 任务生成与优化引擎
├── docs/               # 需求文档
├── tests/              # 单元测试
├── demo-*.mjs          # 示例脚本
├── .env.example        # 环境变量模板
└── README.md
```

---

## 💡 成本优化建议

### 推荐配置 (低成本)

```env
# LLM: DeepSeek (¥0.001/1K tokens)
LLM_PROVIDER=custom
CUSTOM_BASE_URL=https://api.deepseek.com
CUSTOM_MODEL=deepseek-chat

# Embedding: 本地免费
EMBEDDING_PROVIDER=local
```

**单次优化成本**: ~¥0.02 (3 次迭代)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

ISC License

---

## 🙏 致谢

- [OpenAI](https://openai.com/) - GPT 模型
- [Anthropic](https://www.anthropic.com/) - Claude 模型
- [Google](https://ai.google.dev/) - Gemini 模型
- [Xenova/transformers.js](https://github.com/xenova/transformers.js) - 本地 Embedding
- [Ollama](https://ollama.ai/) - 本地 LLM 运行

---

**TaskForge** - 让任务拆解更智能、更高效！ 🚀
