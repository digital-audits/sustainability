import {Sustainability} from '../src';
import Connection from '../src/connection/connection';
import Commander from '../src/commander/commander';

import {AuditSettings} from '../src/types';
import * as fastify from 'fastify';
import {Server, IncomingMessage, ServerResponse} from 'http';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { Report } from '../src/types/audit';

const server: fastify.FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse
> = fastify();

server.register(require('fastify-static'), {
	root: path.join(__dirname, 'examples')
});

const runAudit = (path: string, options = {} as AuditSettings, url?:string) => {
	if(!url) url = `http://localhost:3334/${path}.html`;

	return Sustainability.audit(url, options);
};

beforeAll(async () => {
	await server.listen(3334);
});

afterAll(async () => {
	await server.close();
});


describe('run test on sites', ()=>{
	it('scores audits', async ()=>{
		const report = await runAudit('',{},'https://audits.digital')
		expect(report.globalScore).toBeGreaterThan(50)
	})
	it('scores akiles', async()=>{
		const report = await runAudit('', {}, 'https://akiles.app')
		expect(report.globalScore).toBeDefined()
	})
})



