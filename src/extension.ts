// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';

interface YYTData {
	date: Date
	fileName: string
	yytWebUrl: string
}

const octokit = new Octokit();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const savedLastYYT: YYTData | undefined = context.globalState.get('LastYYT');

	getLastYYT().then(lastYYT => {
		if (savedLastYYT && savedLastYYT.date.getTime() === lastYYT.date.getTime()) {
			return; // 알림을 띄우지 않고 리턴.
		} else {
			showYYTMessage(context, lastYYT);
		}
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('yingyeothon-reminder.checkYYT', () => {
		getLastYYT().then(yyt => {
			showYYTMessage(context, yyt);
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function getLastYYT(): Promise<YYTData> {
	const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
		owner: 'yingyeothon',
		repo: 'yingyeothon.github.io',
		path: '_posts'
	});

	const files = response.data as { name: string }[];
	const lastPost = files[files.length - 1];

	const data = lastPost.name.match(/(\d+-\d+-\d+)-(.*).md/) as string[];
	if (!data) {
		vscode.window.showInformationMessage(`${response.data}`);
		throw Error(`cannot handle file: ${lastPost.name}`);
	}

	const lastYYT = {
		date: new Date(data[1]),
		fileName: data[2],
		yytWebUrl: `https://yyt.life/${data[1].replaceAll('-', '/')}/${data[2]}.html`,
	};

	return lastYYT;
}

function showYYTMessage(context: vscode.ExtensionContext, yyt: YYTData) {
	const targetDate = new Date(yyt.date);
	targetDate.setHours(23);
	targetDate.setMinutes(59);
	targetDate.setSeconds(59);

	const now = Date.now();
	const message = (now <= targetDate.getTime())
		? `다음 잉여톤은 ${yyt.fileName} 입니다 (${yyt.date.toISOString().slice(0, 10)})`
		: `지난 잉여톤은 ${yyt.fileName} 이었습니다 (${yyt.date.toISOString().slice(0, 10)})`;

	vscode.window.showInformationMessage(message, ...['잉여톤 사이트로', '다음 잉여톤까지 그만보기', '닫기'])
		.then((selection) => {
			switch (selection) {
				case '잉여톤 사이트로':
					vscode.env.openExternal(vscode.Uri.parse(yyt.yytWebUrl));
					break;
				case '다음 잉여톤까지 그만보기':
					context.globalState.update('LastYYT', yyt);
					break;
			}
		});
}