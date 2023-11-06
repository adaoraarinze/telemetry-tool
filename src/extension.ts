// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { diffLines, diffChars } from 'diff';

const uuidv4 = require('uuid').v4;
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let currentPosition = vscode.window.activeTextEditor?.selection.active;
	let type = "human";
	let oldText = "";
    let UUID = context.globalState.get('extension.uuid') || null;

    if (!UUID) {
        const newUUID = uuidv4();
        context.globalState.update('extension.uuid', newUUID);
		UUID = newUUID;
    }


	async function doPostRequest(linesAdded: any, linesDeleted: any, charactersAdded: any, 
		charactersDeleted: any, charactersModified: any, position: any, type: String) {
		const editor = vscode.window.activeTextEditor;
		let fileName = "";
        if (editor) {
			const document = editor.document;
			const filePath = document.fileName;
			fileName = path.basename(filePath);
		}

		let payload = { fileName: fileName, linesAdded: linesAdded, linesDeleted: linesDeleted, charactersAdded: charactersAdded, 
			charactersDeleted: charactersDeleted, charactersModified: charactersModified, position: position.line + 1, type: type, userID: UUID };
		let res = await axios.post('http://localhost:3000/', payload);
		let data = res.data;
		console.log(data);
	}

	function getText(editor: vscode.TextEditor) {
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);
			return content;
		}
	}

	function getEdits() {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			const lineDiff = diffLines(oldText, content);
			const charDiff = diffChars(oldText, content);

			let linesAdded = 0;
			let linesDeleted = 0;
			let charactersAdded = 0;
			let charactersDeleted = 0;
		  
			lineDiff.forEach((part) => {
				if (part.added && ((oldText.match(/\n/g) || []).length !== (content.match(/\n/g) || []).length)) {
					linesAdded += part.count ?? 0;
				} else if (part.removed && ((oldText.match(/\n/g) || []).length !== (content.match(/\n/g) || []).length)) {
					linesDeleted += part.count ?? 0;
				}
			});

			

			charDiff.forEach((part) => {
				if (part.added) {
					charactersAdded += part.count ?? 0;
				} else if (part.removed) {
					charactersDeleted += part.count ?? 0;
				}
			});

			return {
			  linesAdded,
			  linesDeleted,
			  charactersAdded,
			  charactersDeleted,
			  charactersModified: charactersAdded + charactersDeleted,
			};

		}
	}

	vscode.tasks.onDidStartTask(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			type = `Task started (${event.execution.task.name})`;
			const position = editor.selection.active;
			
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = content;
		}
	});

	vscode.tasks.onDidEndTask(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			type = `Task ended (${event.execution.task.name})`;
			const position = editor.selection.active;

			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = content;
		}
	});

	vscode.workspace.onDidSaveTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			type = "saved file";
			const position = editor.selection.active;

			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = content;
		}
	});

	vscode.debug.onDidStartDebugSession(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			type = "debug session started";
			const position = editor.selection.active;

			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = content;
		}
	});

	vscode.debug.onDidTerminateDebugSession(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			type = "debug session ended";
			const position = editor.selection.active;

			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = content;
		}
	});

	vscode.debug.onDidChangeBreakpoints(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			event.added.forEach(element => {
				type = "breakpoint added";
				const position = editor.selection.active;
				const result = getEdits();
				doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
					result?.charactersDeleted, result?.charactersModified, position, type);
				oldText = content;
			});

			event.removed.forEach(element => {
				type = "breakpoint removed";
				const position = editor.selection.active;
				const result = getEdits();
				doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
					result?.charactersDeleted, result?.charactersModified, position, type);
				oldText = content;
			});

			event.changed.forEach(element => {
				type = "breakpoint changed";
				const position = editor.selection.active;
				const result = getEdits();
				doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
					result?.charactersDeleted, result?.charactersModified, position, type);
				oldText = content;
			});
		}
	});

	vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		type = "human";

		if (editor !== undefined) {
			// get the document text
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			const content = editor.document.getText(textRange);

			vscode.env.clipboard.readText().then((text) => {
				let clipboardContent = text;

				if (event.contentChanges[0].text === clipboardContent) {
					const position = editor.selection.active;
					type = "pasted";

					const result = getEdits();
					console.log('Lines Added:', result?.linesAdded);
					console.log('Lines Deleted:', result?.linesDeleted);
					console.log('Characters Added:', result?.charactersAdded);
					console.log('Characters Deleted:', result?.charactersDeleted);
					console.log('Characters Modified:', result?.charactersModified);


					doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
						result?.charactersDeleted, result?.charactersModified, position, type);
					oldText = content;
				}
				if (event.contentChanges[0].text.length > 2 && !(/^\s*$/.test(event.contentChanges[0].text))
					&& event.contentChanges[0].text !== clipboardContent) {
					const position = editor.selection.active;
					type = "completion";

					const result = getEdits();

					doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
						result?.charactersDeleted, result?.charactersModified, position, type);
					oldText = content;
				}
				else if (currentPosition !== undefined && currentPosition.line !== editor.selection.active.line && type === "human") {
					const position = editor.selection.active;

					const result = getEdits();

					doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded, 
						result?.charactersDeleted, result?.charactersModified, position, type);
					oldText = content;
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
