// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidSaveTextDocument( (document: vscode.TextDocument) => {
		if (document.uri.scheme === "file") {
			const editor = vscode.window.activeTextEditor;

		// check if there is no selection
		if (editor !== undefined) {
			if (editor.selection.isEmpty) {
		    // the Position object gives you the line and character where the cursor is
		    const position = editor.selection.active;
			const lineText = editor.document.lineAt(position.line).text;
            const currentLine = lineText.substring(0, lineText.length);
			context.globalState.update("currentLine", currentLine);
			context.globalState.update("position", position.line + 1);
			async function doPostRequest() {

				let payload = { currentLine: currentLine, position: position.line + 1 };
			
				let res = await axios.post('http://localhost:3000/', payload);
			
				let data = res.data;
				console.log(data);
			}
			doPostRequest();
		    console.log(context.globalState.get("currentLine"), context.globalState.get("position"));
	     	}
	    }
		}
	});

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from VS Code.');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
