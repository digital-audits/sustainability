import {Browser} from 'puppeteer';
import * as fastify from 'fastify';
import {Server, IncomingMessage, ServerResponse} from 'http';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as util from '../../src/utils/utils';
import * as testUtil from '../utils/test.utils'

import CollectAssets from '../../src/collect/assets.collect';
import CollectConsole from '../../src/collect/console.collect';
import CollectFailedTransfers from '../../src/collect/failed-transfer.collect';
import {
	CollectImagesTraces,
	CollectTransferTraces,
	CollectSubfontsTraces
} from '../../src/types/traces';
import CollectRedirect from '../../src/collect/redirect.collect';
import CollectImages from '../../src/collect/images.collect';
import CollectLazyImages from '../../src/collect/lazyimages.collect';
import CollectTransfer from '../../src/collect/transfer.collect';
import CollectSubfont from '../../src/collect/subfont.collect';

const server: fastify.FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse
> = fastify();

server.register(require('fastify-static'), {
	root: path.join(__dirname, '../examples')
});

server.get('/305-js', (_, reply) => {
	reply.header('Location', 'http://localhost:3333/redirected.html');
	reply.status(305);
	reply.redirect('/redirected.js');
});

server.get('/redirect-host-js', (_, reply) => {
	reply.status(302);
	reply.redirect('http://mylocalhost:3333/redirected.js');
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
describe('Assets collector', () => {
	it('collects js relative source maps', async () => {
		const path = 'sourcemap';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectAssets.collect, browser);
		expect(assets?.js.scripts[0].map.type).toMatch(`relative`)
		expect(assets?.js.scripts[0].map.value).toMatch(
			`http://localhost:3333/externaljs.js.map`
		);
	});

	it('collects js base64 source maps', async () => {
		const path = 'sourcemap';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectAssets.collect, browser);
		expect(assets?.js.scripts[1].map.type).toMatch(`base64`)
		expect(assets?.js.scripts[1].map.value).toMatch(
			`{\"version\":3,\"file\":\"\",\"sources\":[\"foo.js\",\"bar.js\"],\"names\":[],\"mappings\":\";;;;;;;;;UACG;;;;;;;;;;;;;;sBCDH;sBACA\"}`
		);
	});

	it('collects external (multiple) css assets', async () => {
		const path = 'externalcss';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectAssets.collect, browser);
		expect(assets?.css.sheets.length).toBeGreaterThan(1);
		expect(assets?.css.sheets[0].text).toMatch(`body{background-color: green}`);
	});
	it('collects inline js assets', async () => {
		const path = 'inlinejs';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectAssets.collect, browser);
		expect(assets?.js.info.scripts[0].text).toMatch(
			`const hello = 'I am an inline script'`
		);
	});
	it('collects inline css assets', async () => {
		const path = 'inlinecss';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectAssets.collect, browser);
		expect(assets?.css.info.styles[0].text).toMatch(
			`body{background-color: green}`
		);
	});
});

describe('Console collector', () => {
	it('collects log console messages (multiple)', async () => {
		const path = 'externaljs';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectConsole.collect, browser);
		expect(assets?.console.length).toBeGreaterThan(2);
		expect(assets?.console[0].text).toMatch(
			'One day this shall be a digital sustainability standard'
		);
		expect(assets?.console[0].type).toBe('log');
	});
	it('collects warning console messages', async () => {
		const path = 'externaljs';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectConsole.collect, browser);
		expect(assets?.console[1].type).toBe('warning');
	});
	it('collects error console messages', async () => {
		const path = 'externaljs';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectConsole.collect, browser);
		expect(assets?.console[2].type).toBe('error');
	});
});

describe('Failed transfer collector', () => {
	it('collects failed requests', async () => {
		const path = '404';
		const assets = await testUtil.navigateAndReturnAssets(
			path,
			CollectFailedTransfers.collect,
			browser
		);
		expect(assets?.failed.length).toBeGreaterThan(0);
	});
});

describe('Redirect collector', () => {
	it('collects redirect requests', async () => {
		const path = '305';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectRedirect.collect, browser);
		expect(assets?.redirect.length).toBeGreaterThan(0);
		expect(assets?.redirect[0].redirectsTo).toMatch(
			'http://localhost:3333/redirected.js'
		);
	});

	it('collects page hosts', async () => {
		const path = 'redirect-host';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectRedirect.collect, browser);
		expect(assets?.hosts.length).toEqual(2);
		expect(assets?.hosts[0]).toMatch('localhost');
		expect(assets?.hosts[1]).toMatch('mylocalhost');
	});
});

describe('Images collector', () => {
	let assets: CollectImagesTraces | undefined;
	beforeAll(async () => {
		const path = 'images';
		assets = await testUtil.navigateAndReturnAssets(path, CollectImages.collect, browser);
	});
	it('collects images', () => {
		expect(assets?.media.images.length).toEqual(15);
	});

	it('collects images atributes', () => {
		expect(Object.keys(assets?.media.images[9]!)).toEqual([
			'isVisible',
			'loading',
			'src',
			'width',
			'height',
			'alt'
		]);
	});

	it('collects non visible (below the fold) images', () => {
		expect(assets?.media.images[9]!.isVisible).toBe(false);
	});

	it('collects visible (above the fold) images', () => {
		expect(assets?.media.images[1]!.isVisible).toBe(true);
	});
});

describe('Lazy images collector', () => {
	it('collects lazy loaded images', async () => {
		const path = 'images';
		const assets = await testUtil.navigateAndReturnAssets(
			path,
			CollectLazyImages.collect,
			browser
		);
		expect(assets?.lazyImages.length).toBe(6);
	});
});

describe('Transfer collector', () => {
	let assets: CollectTransferTraces | undefined;
	const spy = jest.spyOn(util, 'log');

	beforeAll(async () => {
		const path = 'transfer';
		assets = await testUtil.navigateAndReturnAssets(path, CollectTransfer.collect, browser);
	});
	afterAll(() => {
		spy.mockRestore();
	});

	it('collects request object', async () => {
		expect(Object.keys(assets?.record[0].request!)).toEqual([
			'requestId',
			'url',
			'resourceType',
			'method',
			'headers',
			'timestamp',
			'protocol'
		]);
	});
	it('collects response object', () => {
		expect(Object.keys(assets?.record[0].response!)).toEqual([
			'remoteAddress',
			'status',
			'url',
			'fromServiceWorker',
			'headers',
			'uncompressedSize',
			'timestamp'
		]);
	});
	it('collects cdp object', () => {
		expect(Object.keys(assets?.record[0].CDP!)).toEqual(['compressedSize']);
	});
	it('logs error at redirect response', () => {
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe('Subfont collector', () => {
	let assets: CollectSubfontsTraces | undefined;
	beforeAll(async () => {
		const path = 'fonts';
		assets = await testUtil.navigateAndReturnAssets(path, CollectSubfont.collect, browser);
	});
	it('collects page fonts', () => {
		expect(assets?.fonts.length).toEqual(2);
		expect(assets?.fonts[0].name).toMatch('Arial');
	});
	it('collects glyphs, weights and styles for each font', () => {
		expect(assets?.fonts[0].value.glyphs).toMatch(
			'U+20,U+2E,U+54,U+61,U+63,U+64,U+68,U+69,U+6C,U+6E,U+6F,U+73-75,U+79'
		);
		expect(assets?.fonts[0].value.weights).toEqual(['800']);
		expect(assets?.fonts[0].value.styles).toEqual(['italic']);
	});
});

/*
describe.only('Blocks bots', ()=>{
	it('works', async()=>{
		const path = 'bot-blocks';
		const assets = await testUtil.navigateAndReturnAssets(path, CollectHTML.collect, browser);
		console.log(assets!.html)
	})
})
*/


