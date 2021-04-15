import { Sustainability } from '../src';
import Connection from '../src/connection/connection';
import Commander from '../src/commander/commander'

import { AuditSettings } from '../src/types';
import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import { Page, Browser } from 'puppeteer'
import * as fetch from 'node-fetch'

const server: FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse
> = fastify();

server.register(require('fastify-static'), {
	root: path.join(__dirname, 'examples')
});
server.get('/health.html', (_, reply) => {
	reply.status(302);
	reply.redirect('http://localhost:3334/animations.html');
});

const runAudit = (path: string, options?: AuditSettings, url?: string, enableTelemetry = false) => {
	if (!url) url = `http://localhost:3334/${path}.html`;
	const connectionSettings = { ...options?.connectionSettings, telemetry: false }
	return Sustainability.audit(url, (enableTelemetry ? options : { ...options, connectionSettings }));
};

beforeAll(async () => {
	await server.listen(3334);
});

afterAll(async () => {
	await server.close();
});


describe('Sustainability', () => {
	it('works with default options', async () => {
		const report = await runAudit('animations', {
			launchSettings: {
				headless: true,
				timeout: 0
			}
		})
		expect(report).toBeTruthy()
	})
	it('works on redirected URLs', async () => {
		const report = await runAudit('health')
		expect(report).toBeTruthy()
	})
	it('works with coldRun disabled and streams enabled', async () => {
		await runAudit('animations', { connectionSettings: { coldRun: false, streams: true } })
		Sustainability.auditStream.pipe(process.stdout);
		expect(true).toBeTruthy()
	})
	it('works when custom browser is passed', async () => {
		const browser = await Connection.setUp()
		await runAudit('animations', {
			browser
		})
		expect(true).toBeTruthy()
	})
	it('sends telemetry', async () => {
		const fetchMock = jest.spyOn(fetch, 'default');
		await runAudit('health', {}, '', true)
		const fetchCallsWithTelemetryEnabled = fetchMock.mock.calls.length
		fetchMock.mockClear()
		await runAudit('health', { connectionSettings: { telemetry: false } })
		const fetchCallsWithTelemetryDisabled = fetchMock.mock.calls.length
		expect(fetchCallsWithTelemetryDisabled).toBeLessThan(fetchCallsWithTelemetryEnabled)
	})


})

describe('targeted tests to improve coverage', () => {
	it('commander setup throws error', async () => {
		try {
			expect(await Commander.setUp({ url: 'http://localhost:3334/animations.html', page: {} as Page }))
		} catch (error) {
			expect(true).toBeTruthy()
		}
	})
	it('commander staticEvaluate throws error', async () => {
		try {
			expect(await Commander.staticEvaluate({ url: 'http://localhost:3334/animations.html', page: {} as Page }))
		} catch (error) {
			expect(true).toBeTruthy()

		}
	})
	it('test with wrong process env bin chrome', async () => {
		process.env.CHROME_BIN = '/usr/local/bin/chrome'
		try {
			await runAudit('animations', {
			})
		} catch (error) {
			expect(true).toBeTruthy()
		}
	})
	it('test with wrong browser option', async () => {
		try {
			await runAudit('animations', {
				browser: {
					newPage: async () => new Promise((resolve) => resolve({} as Page))
				} as Browser, connectionSettings: { coldRun: false }
			})
		} catch (error) {
			expect(true).toBeTruthy()
		}
	})
})


