import { Browser } from "puppeteer";
import { DEFAULT } from "../../src/settings/settings";
import * as fs from 'fs'
import * as path from 'path';
import { PageContext } from "../../src/types";
import { ConnectionSettingsPrivate } from "../../src/types/settings";

const defaultConnectionSettings = DEFAULT.CONNECTION_SETTINGS;

export const createPageContext = async (file: string, browser:Browser, url?: string) => {
	const page = await browser.newPage();
	await Promise.all([
		page.evaluateOnNewDocument(
			fs.readFileSync(require.resolve('characterset'), 'utf8')
		),
		page.evaluateOnNewDocument(
			fs.readFileSync(
				path.resolve(__dirname, '../../src/bin/glyphhanger-script.js'),
				'utf8'
			)
		)
	]);

	if (!url) url = `http://localhost:3333/${file}.html`;

	return {page, url};
};

const navigate = (pageContext: PageContext) => {
	const {page, url} = pageContext;
	return page.goto(url, {waitUntil: 'networkidle0'});
};

export const navigateAndReturnAssets = async <
	T extends (context: PageContext, settings: ConnectionSettingsPrivate) => any
>(
	path: string,
    collector: T,
    browser:Browser,
	url?: string
): Promise<ReturnType<T> | undefined> => {
	try {
		const pageContext = await createPageContext(path,browser, url);
		const promises = await Promise.all([
			navigate(pageContext),
			collector(pageContext, defaultConnectionSettings)
		]);

		return promises[1];
	} catch (error) {
		console.log(error);
		return undefined;
	}
};