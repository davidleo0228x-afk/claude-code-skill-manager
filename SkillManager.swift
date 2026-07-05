import SwiftUI
import WebKit
import AppKit

// MARK: - WebView

struct WebView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs

        let view = WKWebView(frame: .zero, configuration: config)
        view.setValue(false, forKey: "drawsBackground")
        view.load(URLRequest(url: url))
        return view
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}

// MARK: - App

@main
struct SkillManagerApp: App {
    @State private var serverProcess: Process?

    var body: some Scene {
        WindowGroup {
            WebView(url: URL(string: "http://localhost:3099")!)
                .frame(minWidth: 800, minHeight: 600)
                .onAppear { startServer() }
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }

    func startServer() {
        guard serverProcess == nil else { return }

        // Check if server already running
        if let url = URL(string: "http://localhost:3099/api/skills"),
           let _ = try? Data(contentsOf: url) {
            return
        }

        let process = Process()
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        process.executableURL = URL(fileURLWithPath: "/usr/local/bin/node")
        process.arguments = ["server.js"]
        process.currentDirectoryURL = URL(fileURLWithPath: home + "/skill-manager")
        process.standardOutput = FileHandle.nullDevice
        process.standardError = FileHandle.nullDevice
        try? process.run()
        serverProcess = process
        Thread.sleep(forTimeInterval: 0.8)
    }
}
