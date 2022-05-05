// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "yingyeothon-reminder" is now active!');

	const octokit = new Octokit();

	octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
		owner: 'yingyeothon',
		repo: 'yingyeothon.github.io',
		path: '_posts'
	}).then((response) => {
		const files = response.data as { name: string }[];
		const lastPost = files[files.length-1];

		const data = lastPost.name.match(/(\d+-\d+-\d+)-(.*).md/) as string[];
		if (!data) {
			vscode.window.showInformationMessage(`${response.data}`);
			throw Error(`cannot handle file: ${lastPost.name}`);
		}

		const lastYYT =  {
			date: new Date(data[1]),
			fileName: data[2],
			yytWebUrl: `https://yyt.life/${data[1].replaceAll('-', '/')}/${data[2]}.html`,
		};

		const targetDate = new Date(lastYYT.date);
		targetDate.setHours(23);
		targetDate.setMinutes(59);
		targetDate.setSeconds(59);

		const now = Date.now();
		const message = (now <= targetDate.getTime())
			? `다음 잉여톤은 ${lastYYT.fileName} 입니다`
			: `지난 잉여톤은 ${lastYYT.fileName} 이었습니다`;

		vscode.window.showInformationMessage(message, ...['잉여톤 사이트', '다음 잉여톤까지 그만보기', '닫기'])
			.then((selection) => {
				switch (selection) {
					case '잉여톤 사이트':
						vscode.env.openExternal(vscode.Uri.parse(lastYYT.yytWebUrl));
						break;
					case '다음 잉여톤까지 그만보기':
						// TODO : 구현
						break;
				}
			});
	});


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('yingyeothon-reminder.checkSchedule', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage(`Next yingyeothon is: ${new Date()}`);
	// });

	// context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
