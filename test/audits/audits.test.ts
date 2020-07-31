import * as fastify from 'fastify';
import {Server, IncomingMessage, ServerResponse} from 'http';
import * as path from 'path';
import { Browser } from 'puppeteer';
import * as testUtil from '../utils/test.utils'
import * as puppeteer from 'puppeteer';
import { MaintainabilityAudit } from '../../src/audits/Maintainability.audit';
import { Traces } from '../../src/types/traces';

const server: fastify.FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse
> = fastify();

server.register(require('fastify-static'), {
	root: path.join(__dirname, '../examples')
});

let browser: Browser;

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


describe('Maintainability Audit', ()=>{
    it('fails on relative sourceMaps with maintainability index below 50', async ()=>{

		const jsTraces = {

		}
		const traces = {js:jsTraces} as Traces
		

		const result = await MaintainabilityAudit.audit(traces)
	})
})