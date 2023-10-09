// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let currentPosition = vscode.window.activeTextEditor?.selection.active;
	let type = "human";

	vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		let newText = "";
		type = "human";

		async function doPostRequest(content:String, newText:String, position:any, type:String) {
			let payload = { content: content, newText: newText, position: position.line + 1, type: type };
			let res = await axios.post('http://localhost:3000/', payload);
			let data = res.data;
			console.log(data);
		}

		if (editor !== undefined) {
			// get the document text
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			vscode.env.clipboard.readText().then((text)=>{
				let clipboardContent = text; 

			if(event.contentChanges[0].text === clipboardContent){
				const position = editor.selection.active;
				newText = event.contentChanges[0].text;
				type = "pasted";
				doPostRequest(content, newText, position, type);
			}
			if(event.contentChanges[0].text.length > 2 && !(/^\s*$/.test(event.contentChanges[0].text)) 
			&& event.contentChanges[0].text !== clipboardContent){
				const position = editor.selection.active;
				newText = event.contentChanges[0].text;
				type = "completion";
				doPostRequest(content, newText, position, type);
			}
			else if (currentPosition !== undefined && currentPosition.line !== editor.selection.active.line) {
				const position = editor.selection.active;
				doPostRequest(content, newText, position, type);
			}
			currentPosition = editor.selection.active;
		});
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
