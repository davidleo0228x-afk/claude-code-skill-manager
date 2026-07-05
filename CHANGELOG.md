# 📋 Changelog / 更新日志

All notable changes to Claude Code Skill Manager are documented here.
/
本文档记录了 Claude Code Skill Manager 的所有重要更新。

---

## [v1.0.0] — 2026-07-05

### 🎉 Initial Release / 首次发布

First public release of the Skill Manager desktop application.
/
Skill Manager 桌面应用的首次公开发布。

---

### ✨ New Features / 新功能

| Feature / 功能 | Description / 说明 |
|---|---|
| 🧩🤖 **双平台支持** | 同时管理 Claude Code（27 个）和 OpenCode Codex（8 个）共 35 个 Skills |
| 📋 **技能浏览** | CSS Grid 卡片布局，一目了然查看名称、描述、分类、触发关键词 |
| 🔍 **搜索筛选** | 按名称、分类或平台（Claude / Codex）快速筛选 |
| 🗑️ **删除技能** | 一键移除，支持双平台路径（`~/.agents/skills/` 和 `~/.codex/skills/`） |
| 🔄 **自动同步** | 30 秒轮询检测外部安装的新技能 |
| ✨ **GSAP 滚动动画** | 卡片随滚动淡入（ScrollTrigger.batch）、页面进度条（scrub）、Header 阴影 |
| 🎨 **暗色主题** | 深色 UI + 涟漪点击动效 + 悬停动画 |
| 🖥️ **原生 macOS 应用** | SwiftUI + WKWebView 封装，真正的桌面应用（Dock 图标、⌘Tab 切换） |
| 🌐 **跨平台** | macOS 原生 + Windows/Linux 浏览器模式 |
| ♿ **无障碍** | 尊重 `prefers-reduced-motion` 设置，开启时跳过动画直接显示 |
| 🏷️ **平台徽章** | 每张卡片显示 🧩 Claude / 🤖 Codex 平台标签 |
| 📦 **未知技能支持** | 自动从 SKILL.md frontmatter 读取 `tags`、`category` 等元数据（详见[三级回退机制](#-unknown-skill-fallback--未知技能回退机制)） |
| 🎨 **暗色滚动条** | 自定义滚动条样式，无白色区域，与暗色主题完美融合 |

---

### 🛠️ Technical Improvements / 技术改进

| Improvement / 改进 | Detail / 详情 |
|---|---|
| **YAML 解析器重构** | `parseFrontmatter()` 重写为三态状态机（normal / multiline `\|` / array `- item`），正确解析三种 YAML 格式 |
| **三级回退链** | 关键词：预定义映射 → frontmatter `tags` → 描述提取 → 空 |
| | 分类：预定义映射 → frontmatter `category` → `📦 其他` |
| | 描述：预定义映射 → frontmatter `description` → 空 |
| **描述关键词提取** | 当 SKILL.md 无 `tags` 字段时，自动从英文描述中提取关键短语作为触发关键词 |
| **分类图标推测** | `guessCategoryEmoji()` — 根据分类名自动匹配图标（设计→🎨、动画→✨、PPT→📊、AI→🤖 等 14 种） |

---

### 🐛 Bug Fixes / 问题修复

| Bug / 问题 | Fix / 修复 |
|---|---|
| **筛选芯片不工作** | 点击分类芯片后显示所有技能 → `setCategory()` 和 `setPlatform()` 改为互斥，各自重置对方状态 |
| **加载界面卡死** | JavaScript 花括号不匹配（125 `{` vs 126 `}`）→ 恢复被误删的 `function renderCards() {` 声明 |
| **重复函数崩溃** | 新旧两版 `getAllSkills()` 共存 → 删除旧版（调用签名不兼容） |
| **YAML 数组解析失败** | `tags:` 后跟 `- item` 列表被解析为空字符串 → 状态机增加 `array` 状态 |
| **未知技能关键词为空** | 不在预定义列表中的技能 `triggerKeywords` 为 `[]` → 增加 frontmatter tags + 描述提取两级回退 |
| **滚动条白色区域** | 浏览器默认滚动条在暗色主题下显示白色轨道 → 自定义 WebKit + Firefox 暗色滚动条样式 |

---

### 🔧 Unknown Skill Fallback / 未知技能回退机制

When a skill is not in the predefined metadata mappings, the server automatically extracts information from `SKILL.md` frontmatter:
/
当技能不在预定义元数据映射中时，服务器自动从 `SKILL.md` frontmatter 提取信息：

```
触发关键词 / Trigger Keywords:
  ✅ 预定义映射 (TRIGGER_KEYWORDS / CODEX_TRIGGER_KEYWORDS)
  ⬇️ fallback
  ✅ SKILL.md frontmatter: tags / keywords 字段
  ⬇️ fallback
  ✅ 英文描述自动提取 (extractKeywordsFromDescription)
  ⬇️ fallback
  ⬜ 空数组 []

分类 / Category:
  ✅ 预定义映射 (CATEGORIES / CODEX_CATEGORIES)
  ⬇️ fallback
  ✅ SKILL.md frontmatter: category 字段 + 自动图标匹配
  ⬇️ fallback
  ✅ 📦 其他

描述 / Description:
  ✅ 中文预定义描述 (ZH_DESCRIPTIONS / CODEX_ZH_DESCRIPTIONS)
  ⬇️ fallback
  ✅ SKILL.md frontmatter: description 字段
  ⬇️ fallback
  ⬜ 空字符串
```

Example / 示例：安装 `karpathy-guidelines`（不在预定义列表中，无 `tags` 字段）→ 自动从描述提取 5 个关键词标签。

---

### 📦 Package / 打包信息

| Item / 项 | Detail / 详情 |
|---|---|
| 文件 / File | `Skill-Manager.zip` |
| 大小 / Size | ~1.4 MB |
| 下载 / Download | [GitHub Releases](https://github.com/davidleo0228x-afk/claude-code-skill-manager/releases/latest) |
| 平台 / Platforms | 🍎 macOS (arm64 + x86_64) · 🪟 Windows · 🐧 Linux |

---

### 🗂️ File Changes / 文件变更

| File / 文件 | Changes / 变更 |
|---|---|
| `server.js` | 双平台扫描、YAML 解析器重构、三级回退链、描述关键词提取 |
| `public/index.html` | GSAP 动画、平台筛选、未知技能展示、暗色滚动条 |
| `README.md` | 双语完整文档、双平台徽章、GSAP/Codex 说明 |
| `SkillManager.swift` | macOS 原生应用封装 |
| `install.sh` | 跨平台安装脚本 |
| `CHANGELOG.md` | 🆕 本文件 |

---

<p align="center">
  <sub>Built with ❤️ for the Claude Code & Codex community · 为 Claude Code 和 Codex 社区用 ❤️ 构建</sub>
</p>
