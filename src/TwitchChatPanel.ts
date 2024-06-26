import * as vscode from "vscode";
import tmi from "tmi.js";

export class TwitchChatPanel {
    public static currentPanel: TwitchChatPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.html = this._getWebviewContent();

        this._setupTmiClient();
    }

    public static createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (TwitchChatPanel.currentPanel) {
            TwitchChatPanel.currentPanel._panel.reveal(column);
        } else {
            const panel = vscode.window.createWebviewPanel(
                "twitchChat",
                "Twitch Chat",
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );

            TwitchChatPanel.currentPanel = new TwitchChatPanel(panel);
        }
    }

    private _setupTmiClient() {
        const twitchUsername = vscode.workspace
            .getConfiguration("twitchChatExtension")
            .get("twitchUsername", "");

        if (twitchUsername) {
            const client = new tmi.Client({
                channels: [twitchUsername],
            });

            client.connect();

            client.on("message", (channel, tags, message, self) => {
                this._panel.webview.postMessage({
                    type: "chatMessage",
                    message: { id: tags.id, user: tags.username, message },
                });
            });
        } else {
            const openSettingsButton = "Configure";
            vscode.window
                .showErrorMessage(
                    "No channel set! Head over to the settings and type in the Twitch username",
                    openSettingsButton
                )
                .then((selection) => {
                    if (selection === openSettingsButton) {
                        vscode.commands.executeCommand(
                            "workbench.action.openSettings",
                            "twitchChatExtension.twitchUsername"
                        );
                    }
                });
        }
    }

    private _getWebviewContent() {
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

    public dispose() {
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
