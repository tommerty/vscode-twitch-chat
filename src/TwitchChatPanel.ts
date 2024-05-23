import * as vscode from 'vscode';
import tmi from 'tmi.js';

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
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (TwitchChatPanel.currentPanel) {
      TwitchChatPanel.currentPanel._panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'twitchChat',
        'Twitch Chat',
        column || vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );

      TwitchChatPanel.currentPanel = new TwitchChatPanel(panel);
    }
  }

  private _setupTmiClient() {
    const channelName = vscode.workspace.getConfiguration('twitchChatExtension').get('channelName', '');
  
    if (channelName) {
      const client = new tmi.Client({
        channels: [channelName]
      });
  
      client.connect();
  
      client.on('message', (channel, tags, message, self) => {
        this._panel.webview.postMessage({ type: 'chatMessage', message: { id: tags.id, user: tags.username, message } });
      });
    } else {
      vscode.window.showErrorMessage('Please enter a Twitch channel name in the extension settings.');
    }
  }

  private _getWebviewContent() {
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
            <script src="https://cdn.tailwindcss.com"></script>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Twitch Chat</title>
                <style>
                  body {
                    margin: 0;
                    padding: 10px;
                    font-family: Arial, sans-serif;
                  }
                  .message {
                    padding: 2px;
                    background-color: transparent;
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
