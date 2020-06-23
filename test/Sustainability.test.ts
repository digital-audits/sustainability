import Sustainability from '../src/sustainability/sustainability'
import {AuditSettings} from '../src/types/cluster-settings'
import {Browser} from 'puppeteer'
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";
import * as path from 'path'
import * as puppeteer from 'puppeteer';


const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify();


server.register(require('fastify-static'), {
  root: path.join(__dirname, 'examples'),
});

let browser:Browser;

const runAudit = (path:string, options = {} as AuditSettings) =>{
  const sustainability = new Sustainability()
  options.browser = browser
  const url = `http://localhost:3333/${path}.html`

  return sustainability.audit(url, options)
}

beforeAll(async () => {
  await server.listen(3333);
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
});

afterAll(async () => {
  await server.close();
  await browser.close();
});

describe('audit', ()=>{
  test('it works', async ()=>{
    const report = await runAudit('health')
    console.log(report)
    expect(report).toBeTruthy()
  })
})
