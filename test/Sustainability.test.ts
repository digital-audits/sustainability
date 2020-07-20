import {Sustainability} from '../src';
import Connection from '../src/connection/connection';
import Commander from '../src/commander/commander';

import {AuditSettings} from '../src/types';
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

const runAudit = (path: string, options = {} as AuditSettings) => {
	const url = `http://localhost:3334/${path}.html`;

	return Sustainability.audit(url, options);
};

beforeAll(async () => {
	await server.listen(3334);
});

afterAll(async () => {
	await server.close();
});

describe('options', () => {
	const spy = jest.spyOn(Connection, 'setUp');
	const options: AuditSettings = {launchSettings: {headless: true}};

	test('Connection setUp method is called when browser is not passed', async () => {
		await runAudit('health', options);
		expect(spy).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledWith(options.launchSettings);
		spy.mockRestore();
	});
	test('Connection setUp method is not called when browser is passed in', async () => {
		const browser = await puppeteer.launch();
		options.browser = browser;
		await runAudit('health', options);
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	test('Commander setUp method is called with custom connectionSettings', async () => {
		const commanderSpy = jest.spyOn(Commander, 'setUp');
		const conSet: AuditSettings = {
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
		await runAudit('health', conSet);
		expect(commanderSpy).toHaveBeenCalledWith(
			expect.any(Object),
			conSet.connectionSettings
		);
	});
});
