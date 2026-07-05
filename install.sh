#!/usr/bin/env bash
set -e

# ──────────────────────────────────────────────
# Claude Code Skill Manager — Cross-Platform Installer
# ──────────────────────────────────────────────

SKILL_DIR="$HOME/skill-manager"
APP_NAME="Skill Manager"
OS="$(uname -s)"

echo "╔══════════════════════════════════════════╗"
echo "║   🛠️  Claude Code Skill Manager        ║"
echo "║      Cross-Platform Installer           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Check Node.js ────────────────────────────
if ! command -v node &>/dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Install it from: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# ── Copy project files ───────────────────────
echo ""
echo "📁 Installing to $SKILL_DIR ..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ "$SCRIPT_DIR" != "$SKILL_DIR" ]; then
    mkdir -p "$SKILL_DIR"
    cp -R "$SCRIPT_DIR"/* "$SKILL_DIR/" 2>/dev/null || true
fi

# ── macOS: Build native app ──────────────────
if [ "$OS" = "Darwin" ]; then
    echo ""
    echo "🍎 Building native macOS app ..."

    APP_PATH="/Applications/$APP_NAME.app"

    # Check for pre-built app in the package
    if [ -d "$SKILL_DIR/Skill Manager.app" ]; then
        echo "   📦 Found pre-built app bundle, installing ..."
        rm -rf "$APP_PATH" 2>/dev/null || true
        cp -R "$SKILL_DIR/Skill Manager.app" "/Applications/"
        echo "   ✅ App installed to $APP_PATH"
    elif command -v swiftc &>/dev/null; then
        echo "   🔨 Compiling from source (SwiftUI) ..."
        swiftc -parse-as-library \
            -target arm64-apple-macos13.0 \
            -o "$SKILL_DIR/SkillManager_arm64" \
            "$SKILL_DIR/SkillManager.swift" 2>/dev/null || true
        swiftc -parse-as-library \
            -target x86_64-apple-macos13.0 \
            -o "$SKILL_DIR/SkillManager_x86_64" \
            "$SKILL_DIR/SkillManager.swift" 2>/dev/null || true

        # Build .app bundle
        mkdir -p "$APP_PATH/Contents/MacOS"
        mkdir -p "$APP_PATH/Contents/Resources"

        if [ -f "$SKILL_DIR/SkillManager_arm64" ] && [ -f "$SKILL_DIR/SkillManager_x86_64" ]; then
            lipo -create "$SKILL_DIR/SkillManager_arm64" "$SKILL_DIR/SkillManager_x86_64" \
                -output "$APP_PATH/Contents/MacOS/Skill Manager"
            rm "$SKILL_DIR/SkillManager_arm64" "$SKILL_DIR/SkillManager_x86_64"
        elif [ -f "$SKILL_DIR/SkillManager_arm64" ]; then
            mv "$SKILL_DIR/SkillManager_arm64" "$APP_PATH/Contents/MacOS/Skill Manager"
        elif [ -f "$SKILL_DIR/SkillManager_x86_64" ]; then
            mv "$SKILL_DIR/SkillManager_x86_64" "$APP_PATH/Contents/MacOS/Skill Manager"
        fi

        # Generate icon
        if [ -f "$SKILL_DIR/public/icon.png" ]; then
            ICONSET="$SKILL_DIR/icon.iconset"
            mkdir -p "$ICONSET"
            sips -z 16 16     "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_16x16.png" &>/dev/null
            sips -z 32 32     "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_16x16@2x.png" &>/dev/null
            sips -z 32 32     "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_32x32.png" &>/dev/null
            sips -z 64 64     "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_32x32@2x.png" &>/dev/null
            sips -z 128 128   "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_128x128.png" &>/dev/null
            sips -z 256 256   "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_128x128@2x.png" &>/dev/null
            sips -z 256 256   "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_256x256.png" &>/dev/null
            sips -z 512 512   "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_256x256@2x.png" &>/dev/null
            sips -z 512 512   "$SKILL_DIR/public/icon.png" --out "$ICONSET/icon_512x512.png" &>/dev/null
            iconutil -c icns "$ICONSET" -o "$APP_PATH/Contents/Resources/appicon.icns" &>/dev/null
            rm -rf "$ICONSET"
        fi

        # Info.plist
        cat > "$APP_PATH/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Skill Manager</string>
    <key>CFBundleIconFile</key>
    <string>appicon</string>
    <key>CFBundleIdentifier</key>
    <string>com.skillmanager.app</string>
    <key>CFBundleName</key>
    <string>Skill Manager</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

        chmod +x "$APP_PATH/Contents/MacOS/Skill Manager"
        echo "   ✅ App compiled and installed to $APP_PATH"
    else
        echo "   ⚠️  swiftc not found. Install Xcode Command Line Tools:"
        echo "      xcode-select --install"
        echo "   Falling back to browser mode."
    fi

    # Desktop symlink
    rm -f "$HOME/Desktop/$APP_NAME.app" 2>/dev/null || true
    ln -s "$APP_PATH" "$HOME/Desktop/$APP_NAME.app" 2>/dev/null || true
    echo "   ✅ Desktop shortcut created"

# ── Linux ────────────────────────────────────
elif [ "$OS" = "Linux" ]; then
    echo ""
    echo "🐧 Setting up Linux launcher ..."
    cat > "$HOME/.local/share/applications/skill-manager.desktop" << DESKTOP
[Desktop Entry]
Name=Skill Manager
Comment=Claude Code Skill Manager
Exec=node $SKILL_DIR/server.js
Icon=$SKILL_DIR/public/icon.png
Terminal=false
Type=Application
Categories=Utility;
DESKTOP
    ln -sf "$HOME/.local/share/applications/skill-manager.desktop" "$HOME/Desktop/skill-manager.desktop" 2>/dev/null || true
    echo "   ✅ Desktop entry created"

# ── Windows ──────────────────────────────────
elif [[ "$OS" =~ "MINGW"|"MSYS"|"CYGWIN" ]] || [ -n "$WINDIR" ]; then
    echo ""
    echo "🪟 Setting up Windows launcher ..."
    cat > "$SKILL_DIR/start-skill-manager.vbs" << VBS
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node server.js", 0, False
WshShell.Run "http://localhost:3099"
VBS
    echo "   ✅ VBS launcher created. Double-click start-skill-manager.vbs to launch."
fi

# ── Done ─────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Installation Complete!             ║"
echo "║                                         ║"
echo "║   Launch: Double-click desktop icon     ║"
echo "║   Or visit: http://localhost:3099       ║"
echo "╚══════════════════════════════════════════╝"
