import * as vscode from 'vscode';
import { TwitchChatPanel } from './TwitchChatPanel';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand('twitchChatExtension.showChat', () => {
        TwitchChatPanel.createOrShow();
      })
    );
  
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('twitchChatExtension.twitchUsername')) {
        if (TwitchChatPanel.currentPanel) {
          TwitchChatPanel.currentPanel.dispose();
          TwitchChatPanel.createOrShow();
        }
      }
    });
  }

export function deactivate() {}
