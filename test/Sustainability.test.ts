import { Sustainability } from '../src';


import { AuditSettings } from '../src/types';
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';

const server: fastify.FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse
> = fastify();

server.register(require('fastify-static'), {
	root: path.join(__dirname, 'examples')
});

const runAudit = (path: string, options = {} as AuditSettings, url?: string) => {
	if (!url) url = `http://localhost:3334/${path}.html`;

	return Sustainability.audit(url, options);
};

beforeAll(async () => {
	await server.listen(3334);
});

afterAll(async () => {
	await server.close();
});

describe('run test on sites', () => {
	it('scores audits', async () => {
		const report = await runAudit('', {}, 'https://audits.digital')
		expect(report.globalScore).toBeGreaterThan(50)
	})
	it('scores akiles', async () => {
		const report = await runAudit('', {}, 'https://akiles.app')
		expect(report.globalScore).toBeDefined()
	})
})



