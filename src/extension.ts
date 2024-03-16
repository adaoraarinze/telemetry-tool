// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { diffLines, diffChars } from 'diff';
import Diff = require('diff');
import * as parse from 'parse-diff';
import * as crypto from 'crypto';

const uuidv4 = require('uuid').v4;
const path = require('path');

export function activate(context: vscode.ExtensionContext) {
	let currentPosition = vscode.window.activeTextEditor?.selection.active;
	let type = "manually generated";
	const editor = vscode.window.activeTextEditor;
	if (editor !== undefined) {
		const firstLine = editor.document.lineAt(0);
		const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
		var oldText = editor.document.getText(textRange);
	}

	let UUID = context.globalState.get('extension.uuid') || null;
	let fileLines: { [key: string]: { changeType: string, lineNumber: number }[] } = {};
	let fileTimers: { [key: string]: { startTime: number, timeOpen: number } } = {};
	let thinkingTime: number = 0;
	let thinkingTimeStart: number = 0;
	let thinkingTimeString: string = "0h 0m 0s";
	let isInactive: boolean = false;
	let timeoutId: NodeJS.Timeout | null = null;
	let activeEditor = vscode.window.activeTextEditor;
	let isUndoRedo: boolean = false;

	vscode.commands.registerCommand('myCustomUndo', async () => {
		isUndoRedo = true;
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			await vscode.commands.executeCommand('undo');
			const position = editor.selection.active;
			type = "undo";
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	vscode.commands.registerCommand('myCustomRedo', async () => {
		isUndoRedo = true;
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			await vscode.commands.executeCommand('redo');
			const position = editor.selection.active;
			type = "redo";
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	if (activeEditor) {
		const filePath = activeEditor.document.uri.fsPath;
		fileTimers[filePath] = { startTime: Date.now(), timeOpen: 0 };
	}

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (activeEditor) {
			const filePath = activeEditor.document.uri.fsPath;
			if (fileTimers[filePath]) {
				const timeOpen = Date.now() - fileTimers[filePath].startTime;
				fileTimers[filePath].timeOpen += Math.floor(timeOpen / 1000);
			}
		}

		if (editor) {
			const filePath = editor.document.uri.fsPath;
			if (!fileTimers[filePath]) {
				fileTimers[filePath] = { startTime: Date.now(), timeOpen: 0 };
			} else {
				fileTimers[filePath].startTime = Date.now();
			}
		}

		activeEditor = editor;
	});

	function checkCurrentFileTimer(fileName: string) {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const filePath = activeEditor.document.uri.fsPath;
			if (fileTimers[filePath]) {
				const timeOpen = Date.now() - fileTimers[filePath].startTime;
				const totalOpenTime = fileTimers[filePath].timeOpen + Math.floor(timeOpen / 1000);
				const seconds = Math.floor(totalOpenTime);
				const minutes = Math.floor(seconds / 60);
				const hours = Math.floor(minutes / 60);
				return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
			}
		}
	}

	if (!UUID) {
		const newUUID = uuidv4();
		context.globalState.update('extension.uuid', newUUID);
		UUID = newUUID;
	}

	async function doPostRequest(linesAdded: any, linesDeleted: any, charactersAdded: any,
		charactersDeleted: any, charactersModified: any, position: any, type: String) {
		const editor = vscode.window.activeTextEditor;
		let fileName = "";
		let hash = "";
		let totalLines = 0;
		if (editor) {
			const document = editor.document;
			const filePath = document.fileName;
			fileName = filePath;
			hash = crypto.createHash('sha256').update(path.basename(filePath)).digest('hex');
			totalLines = document.lineCount;
		}

		const lines = Object.entries(fileLines[fileName])
			.filter(([key, value]) => value.changeType !== "")
			.map(([key, value]) => value);

		const response = [totalLines, ...Object.values(lines)];

		const time = checkCurrentFileTimer(fileName);

		// Clear any existing timeout
		if (timeoutId) {
			clearTimeout(timeoutId as NodeJS.Timeout);
		}

		if (isInactive) {
			const timeOpen = Date.now() - thinkingTimeStart;
			thinkingTime += Math.floor(timeOpen / 1000);
			const seconds = Math.floor(thinkingTime);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);
			const tempThinkingTimeString = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
			thinkingTimeString = tempThinkingTimeString;
		}

		timeoutId = setTimeout(() => {
			thinkingTimeStart = Date.now();
			isInactive = true;
		}, 5000);

		let payload = {
			fileName: hash, linesAdded: linesAdded, linesDeleted: linesDeleted, charactersAdded: charactersAdded,
			charactersDeleted: charactersDeleted, charactersModified: charactersModified, fileLines: JSON.stringify(response),
			position: position.line + 1, type: type, time: time, thinkingTime: thinkingTimeString, userID: UUID
		};
		try {
			let res = await axios.post('https://telemetry-tool.vercel.app/api', payload);
			let data = res.data;
			console.log(data);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error:', error.message);
			} else {
				console.error('Error:', error);
			}
		}

		isInactive = false;
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
				content,
			};
		}
	}

	vscode.tasks.onDidStartTaskProcess(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			type = `Task started (${event.execution.task.name})`;
			const position = editor.selection.active;
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	vscode.tasks.onDidEndTaskProcess(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			type = `Task ended successfully (${event.execution.task.name})`;
			if (event.exitCode !== 0) {
				type = `Task failed (${event.execution.task.name})`;
			}
			const position = editor.selection.active;
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	vscode.workspace.onDidSaveTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			type = "saved file";
			const position = editor.selection.active;
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	vscode.debug.onDidStartDebugSession(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			type = "debug session started";
			const position = editor.selection.active;
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	vscode.debug.onDidTerminateDebugSession(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			type = "debug session ended";
			const position = editor.selection.active;
			const result = getEdits();

			doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
				result?.charactersDeleted, result?.charactersModified, position, type);
			oldText = result?.content ?? "";
		}
	});

	vscode.debug.onDidChangeBreakpoints(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			event.added.forEach(element => {
				type = "breakpoint added";
				const position = editor.selection.active;
				const result = getEdits();

				doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
					result?.charactersDeleted, result?.charactersModified, position, type);
				oldText = result?.content ?? "";
			});

			event.removed.forEach(element => {
				type = "breakpoint removed";
				const position = editor.selection.active;
				const result = getEdits();

				doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
					result?.charactersDeleted, result?.charactersModified, position, type);
				oldText = result?.content ?? "";
			});
		}
	});

	vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		type = "manually generated";

		if (editor !== undefined) {
			const filePath = editor.document.uri.fsPath;
			const content = editor.document.getText();

			vscode.env.clipboard.readText().then((text) => {
				let clipboardContent = text;
				let startLineNumber = 0;
				let endLineNumber = 0;

				if (event.contentChanges[0].text === clipboardContent && clipboardContent !== "" && !isUndoRedo) {
					const position = editor.selection.active;
					type = "pasted";
					const result = getEdits();

					startLineNumber = event.contentChanges[0].range.start.line + 1;
					const numberOfLines = event.contentChanges[0].text.split('\n').length;
					endLineNumber = startLineNumber + numberOfLines - 1;

					doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
						result?.charactersDeleted, result?.charactersModified, position, type);
					oldText = result?.content ?? "";
				}

				else if (event.contentChanges[0].text.length > 1
					&& !(/^\s*$/.test(event.contentChanges[0].text))
					&& !isUndoRedo && event.contentChanges[0].text !== clipboardContent
					&& !(/^[()\[\]{}\""\'\.]+$/).test(event.contentChanges[0].text)
				) {
					if (/\s/.test(event.contentChanges[0].text)) {
						const position = editor.selection.active;
						type = "auto generated";
						const result = getEdits();

						startLineNumber = event.contentChanges[0].range.start.line + 1;
						const numberOfLines = event.contentChanges[0].text.split('\n').length;
						endLineNumber = startLineNumber + numberOfLines - 1;

						doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
							result?.charactersDeleted, result?.charactersModified, position, type);
						oldText = result?.content ?? "";
					}

					else if (/[()\[\]{}]/.test(event.contentChanges[0].text)) {
						const position = editor.selection.active;
						type = "completion";
						const result = getEdits();

						doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
							result?.charactersDeleted, result?.charactersModified, position, type);
						oldText = result?.content ?? "";
					}
				}

				else if (currentPosition !== undefined && currentPosition.line !== editor.selection.active.line && type === "manually generated" && !isUndoRedo) {
					const position = editor.selection.active;
					const result = getEdits();

					doPostRequest(result?.linesAdded, result?.linesDeleted, result?.charactersAdded,
						result?.charactersDeleted, result?.charactersModified, position, type);
					oldText = result?.content ?? "";
				}

				const lines = content.split('\n');
				if (fileLines[filePath] === undefined) {
					fileLines[filePath] = lines.map((lineContent, index) => {
						return { changeType: "", lineNumber: index + 1 };
					});
				} else {
					const diff = lines.length - fileLines[filePath].length;
					if (diff > 0) {
						// Lines were added
						for (let i = 0; i < diff; i++) {
							const lineNumber = editor.selection.active.line + i + 1;
							const existingType = fileLines[filePath][lineNumber]?.changeType || "";
							fileLines[filePath].splice(lineNumber, 0, { changeType: existingType, lineNumber: lineNumber + 1 });
						}
					} else if (diff < 0) {
						// Lines were removed
						fileLines[filePath].splice(fileLines[filePath].length + diff, -diff);
					}

					// Update line numbers
					fileLines[filePath] = fileLines[filePath].map((line, index) => ({ ...line, lineNumber: index + 1 }));
				}

				fileLines[filePath].forEach(line => {
					if (line.lineNumber === editor.selection.active.line + 1) {
						line.changeType = type;
					} else if (type === "auto generated" || type === "pasted") {
						if (line.lineNumber >= startLineNumber && line.lineNumber <= endLineNumber) {
							line.changeType = type;
						}
					}
				});
				currentPosition = editor.selection.active;
				isUndoRedo = false;
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
