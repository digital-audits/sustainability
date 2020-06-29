

import {PageContext} from '../../src/types/index'
import {Browser} from 'puppeteer'
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";
import * as path from 'path'
import * as puppeteer from 'puppeteer';

import CollectAssets  from "../../src/collect/assets.collect";



const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify();


server.register(require('fastify-static'), {
  root: path.join(__dirname, 'examples'),
});

let browser:Browser;

const createPageContext = async (path:string) => {
  const page = await browser.newPage()
  const url = `http://localhost:3333/${path}.html`

  return {page,url}

}

const navigate = (pageContext:PageContext) => {
  const {page, url} = pageContext
    return page.goto(url, {waitUntil:'networkidle0'})
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

describe('Assets collector', ()=>{
  it('collects external js assets', async ()=>{
    const path = 'externaljs'
    const pageContext = await createPageContext(path)

  expect(CollectAssets.collect(pageContext)).toBeTruthy()

  })
})
