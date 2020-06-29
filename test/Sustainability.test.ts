import sustainability from '../src/sustainability/sustainability';
import Connection from '../src/connection/connection';
import Commander from '../src/commander/commander';

import {AuditSettings} from '../src/types';
import {Browser} from 'puppeteer';
import * as fastify from 'fastify';
import {Server, IncomingMessage, ServerResponse} from 'http';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

const server: fastify.FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse
> = fastify();

server.register(require('fastify-static'), {
	root: path.join(__dirname, 'examples')
});

let browser: Browser;

const runAudit = (path: string, options = {} as AuditSettings) => {
	options.browser = browser;
	const url = `http://localhost:3333/${path}.html`;

	return sustainability.audit(url, options);
};

beforeAll(async () => {
	await server.listen(3333);
	browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
});

afterAll(async () => {
	await server.close();
	await browser.close();
});

describe('options', () => {
	test('id', async () => {
		const options: AuditSettings = {id: '143fer2'};
		const report = await runAudit('health', options);
		expect(report.meta.id).toBe(options.id);
	});
	test('launchSettings', async () => {
		const options: AuditSettings = {launchSettings: {headless: false}};
		await runAudit('health', options);
		expect(Connection.setUp).toHaveBeenCalledWith(options.launchSettings);
	});
	test('connectionSettings', async () => {
		const options: AuditSettings = {
			connectionSettings: {
				maxNavigationTime: 20000,
				maxScrollInterval: 25,
				emulatedDevice: {
					viewport: {
						width: 1900,
						height: 1200
					},
					name: 'Laptop 1900x1200',
					userAgent: 'Digital Audits'
				}
			}
		};
		await runAudit('health', options);
		expect(Commander.setUp).toHaveBeenCalledWith(options.connectionSettings);
	});
});
