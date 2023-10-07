// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let currentPosition = vscode.window.activeTextEditor?.selection.active;
	vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;

		// check if there is no selection
		if (editor !== undefined && editor.selection.isEmpty) {
			// get the document text
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const text = editor.document.getText(textRange);
			// the Position object gives you the line and character where the cursor is
			if (currentPosition !== undefined && currentPosition.line !== editor.selection.active.line) {
				const position = editor.selection.active;

				// send data to server
				async function doPostRequest() {
					let payload = { text: text, position: position.line + 1 };
					let res = await axios.post('http://localhost:3000/', payload);
					let data = res.data;
					console.log(data);
				}
				doPostRequest();
				currentPosition = editor.selection.active;
			}
		}
	});

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "telemetrytool" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('telemetrytool.telemetrytool', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('This extension is collecting telemetry data!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
