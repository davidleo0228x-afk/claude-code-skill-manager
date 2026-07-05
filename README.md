# 🛠️ Claude Code Skill Manager

> A beautiful desktop application to manage all your globally installed [Claude Code](https://claude.ai/code) Skills.

<p align="center">
  <img src="public/icon.png" alt="Skill Manager Icon" width="128" height="128">
</p>

## ✨ Features

- 📋 **Browse all 27 built-in skills** — view names, descriptions, categories, and trigger keywords at a glance
- 🔍 **Search & filter** — quickly find skills by name or category
- 🏷️ **Trigger keywords on cards** — see how to activate each skill without clicking in
- 🗑️ **Delete skills** — remove unwanted skills with one click
- 🔄 **Auto-sync** — automatically detects and syncs when new skills are installed externally
- 🎨 **Dark theme UI** — clean, modern interface with smooth animations
- 🖥️ **Native macOS app** — runs as a real desktop application (SwiftUI + WKWebView), not a browser tab
- 🌐 **Cross-platform** — macOS native app + Windows/Linux browser fallback

## 📸 Screenshots

> *(Add screenshots here — run the app and take some!)*

## 🚀 Quick Start

### macOS (Native App)

```bash
# Clone the repo
git clone https://github.com/davidleo0228x-afk/claude-code-skill-manager.git
cd claude-code-skill-manager

# Install & launch
chmod +x install.sh
./install.sh
```

This compiles the native SwiftUI app and creates a desktop shortcut. Double-click **Skill Manager** on your desktop to open.

### Windows / Linux

```bash
# Clone & enter
git clone https://github.com/davidleo0228x-afk/claude-code-skill-manager.git
cd claude-code-skill-manager

# Install & launch
chmod +x install.sh   # Linux only
./install.sh
```

On Windows and Linux, the app opens in your default browser at `http://localhost:3099`.

### Manual Start

```bash
# Install dependencies (none required — vanilla Node.js!)
# Start the server
node server.js

# Open http://localhost:3099 in your browser
```

## 📁 Project Structure

```
skill-manager/
├── server.js              # Node.js HTTP server (zero dependencies)
├── SkillManager.swift     # Native macOS app (SwiftUI + WKWebView)
├── public/
│   ├── index.html         # Single-page frontend (dark theme)
│   ├── icon.png           # App icon (1254×1254)
│   ├── favicon-32.png     # Favicon
│   └── apple-touch-icon.png
└── install.sh             # Cross-platform installer
```

## 🔧 How It Works

1. **Server** (`server.js`) — A zero-dependency Node.js HTTP server that:
   - Parses `SKILL.md` files from `~/.agents/skills/` (YAML frontmatter)
   - Reads skill metadata from `~/.claude/skills/` symlinks
   - Exposes REST API: `GET /api/skills`, `GET /api/skills/:name`, `DELETE /api/skills/:name`
   - Serves static files from `public/`

2. **Frontend** (`public/index.html`) — A single-page app featuring:
   - CSS Grid card layout with hover animations
   - Real-time search and category filtering
   - Detail modal with full skill information
   - Auto-refresh with change detection (30s interval)
   - Sync progress bar and shimmer animations
   - Click ripple effects on cards

3. **Native App** (`SkillManager.swift`) — SwiftUI wrapper that:
   - Embeds the web UI in a `WKWebView`
   - Auto-starts the Node.js server on launch
   - Runs as a proper macOS application (Dock icon, ⌘Tab, etc.)
   - Supports both Apple Silicon and Intel Macs (universal binary)

## 🏗️ Build From Source

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- **macOS only:** Xcode Command Line Tools (`xcode-select --install`)

### Build the Native macOS App

```bash
# Compile universal binary (arm64 + x86_64)
swiftc -parse-as-library \
  -target arm64-apple-macos13.0 \
  -o SkillManager_arm64 \
  SkillManager.swift

swiftc -parse-as-library \
  -target x86_64-apple-macos13.0 \
  -o SkillManager_x86_64 \
  SkillManager.swift

lipo -create SkillManager_arm64 SkillManager_x86_64 \
  -output "Skill Manager.app/Contents/MacOS/Skill Manager"

# Clean up intermediates
rm SkillManager_arm64 SkillManager_x86_64
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js (vanilla, zero dependencies) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Native App (macOS) | SwiftUI, WKWebView, AppKit |
| Package | Universal Mach-O binary (arm64 + x86_64) |
| Icons | `iconutil` + `sips` → `.icns` |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

## 📄 License

MIT © [davidleo0228x-afk](https://github.com/davidleo0228x-afk)

---

<p align="center">
  <sub>Built with ❤️ for the Claude Code community</sub>
</p>
