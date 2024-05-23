"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchChatPanel = void 0;
const vscode = __importStar(require("vscode"));
const tmi_js_1 = __importDefault(require("tmi.js"));
class TwitchChatPanel {
    static currentPanel;
    _panel;
    _disposables = [];
    constructor(panel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        this._setupTmiClient();
    }
    static createOrShow() {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (TwitchChatPanel.currentPanel) {
            TwitchChatPanel.currentPanel._panel.reveal(column);
        }
        else {
            const panel = vscode.window.createWebviewPanel('twitchChat', 'Twitch Chat', column || vscode.ViewColumn.One, {
                enableScripts: true
            });
            TwitchChatPanel.currentPanel = new TwitchChatPanel(panel);
        }
    }
    _setupTmiClient() {
        const twitchUsername = vscode.workspace.getConfiguration('twitchChatExtension').get('twitchUsername', '');
        if (twitchUsername) {
            const client = new tmi_js_1.default.Client({
                channels: [twitchUsername]
            });
            client.connect();
            client.on('message', (channel, tags, message, self) => {
                this._panel.webview.postMessage({ type: 'chatMessage', message: { id: tags.id, user: tags.username, message } });
            });
        }
        else {
            const openSettingsButton = 'Configure';
            vscode.window.showErrorMessage('No channel set! Head over to the settings and type in the Twitch username', openSettingsButton)
                .then((selection) => {
                if (selection === openSettingsButton) {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'twitchChatExtension.twitchUsername');
                }
            });
        }
    }
    _getWebviewContent() {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Twitch Chat</title>
                <style>
                  html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                  }
                  body {
                    display: flex;
                    flex-direction: column;
                    font-family: Arial, sans-serif;
                  }
                  #chat {
                    flex: 1;
                    overflow-y: scroll;
                  }
                  .message {
                    padding: 5px;
                  }
                  .username {
                    font-weight: bold;
                  }
                </style>
            </head>
            <body>
                <div id="chat"></div>
                <script>
                  const vscode = acquireVsCodeApi();
                  const chatElement = document.getElementById('chat');
  
                  window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                      case 'chatMessage':
                        const messageElement = document.createElement('div');
                        messageElement.className = 'message';
                        messageElement.innerHTML = \`<span class="username">\${message.message.user}: </span>\${message.message.message}\`;
                        chatElement.appendChild(messageElement);
                        chatElement.scrollTop = chatElement.scrollHeight;
                        break;
                    }
                  });
                </script>
            </body>
            </html>`;
    }
    dispose() {
        TwitchChatPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.TwitchChatPanel = TwitchChatPanel;
//# sourceMappingURL=TwitchChatPanel.js.map