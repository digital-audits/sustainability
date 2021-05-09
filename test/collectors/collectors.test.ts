import { PageContext } from '../../src/types';
import { Browser } from 'puppeteer';
import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as util from '../../src/utils/utils';
import * as fs from 'fs';
import * as fetch from 'node-fetch';


import CollectAssets from '../../src/collect/assets.collect';
import { DEFAULT } from '../../src/settings/settings';
import CollectFailedTransfers from '../../src/collect/failed-transfer.collect';
import { PrivateSettings } from '../../src/types/settings';
import {
	CollectMediaTraces,
	CollectTransferTraces,
	CollectSubfontsTraces,
	CollectCookiesTraces,
	CollectLazyMediaTraces,
	CollectAnimationsTraces,
	CollectRobotsTraces,
	CollectMetaTagsTraces,
	CollectScreenShotTraces
} from '../../src/types/traces';
import CollectRedirect from '../../src/collect/redirect.collect';
import CollectMedia from '../../src/collect/media.collect';
import CollectLazyMedia from '../../src/collect/lazymedia.collect';
import CollectTransfer from '../../src/collect/transfer.collect';
import CollectSubfont from '../../src/collect/subfont.collect';
import CollectAnimations from '../../src/collect/animations.collect';
import CollectCookies from '../../src/collect/cookies.collect';
import CollectRobots from '../../src/collect/robots.collect';
import CollectMetaTags from '../../src/collect/meta-tag.collect';
import CollectScreenshot from '../../src/collect/screenshot.collect';

const server: FastifyInstance<
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
const defaultConnectionSettings = DEFAULT.CONNECTION_SETTINGS;
const createPageContext = async (file: string, url?: string) => {
	const context = await browser.createIncognitoBrowserContext()
	const page = await context.newPage();
	const pageFeaturesArray = [
		page.setViewport(defaultConnectionSettings.emulatedDevice.viewport),
		page.setUserAgent(defaultConnectionSettings.emulatedDevice.userAgent),
		page.setCacheEnabled(false),
		page.setBypassCSP(true),
		// Glyphhanger dependency
		page.evaluateOnNewDocument(
			fs.readFileSync(require.resolve('characterset'), 'utf8')
		),
		page.setDefaultNavigationTimeout(0),
		page.evaluateOnNewDocument(
			fs.readFileSync(
				path.resolve(__dirname, '../../src/bin/glyphhanger-script.js'),
				'utf8'
			)
		)
	];
	await Promise.all(pageFeaturesArray);

	if (!url) url = `http://localhost:3333/${file}.html`;

	return { page, url };
};

const navigate = (pageContext: PageContext) => {
	const { page, url } = pageContext;
	return page.goto(url, { waitUntil: 'networkidle0' });
};

const navigateAndReturnAssets = async <
	T extends (context: PageContext, settings: PrivateSettings) => any
>(
	path: string,
	collector: T,
	url?: string
): Promise<ReturnType<T> | undefined> => {
	const pageContext = await createPageContext(path, url);
	const { page } = pageContext

	try {
		const runSpecificCode = async () => {
			if (path.startsWith('animations')) {
				await util.scrollFunction(page, defaultConnectionSettings.maxScrollInterval)
			}
		}

		const promises = await Promise.all([
			navigate(pageContext).then(runSpecificCode),
			collector(pageContext, defaultConnectionSettings)
		]);


		return promises[1];
	} catch (error) {
		console.log(error);
		return undefined;
	}
	finally {
		await page.close()
	}
};

beforeAll(async () => {
	await server.listen(3333);
	browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbo', '--disable-dev-shm-usage', '--shm-size=3gb']
	});
});

afterAll(async () => {
	await server.close();
	await browser.close();
});
describe('Assets collector', () => {
	it('collects external js assets', async () => {
		const path = 'externaljs';
		const assets = await navigateAndReturnAssets(path, CollectAssets.collect);
		expect(assets?.js.scripts[0].text).toMatch(
			`const co2Reduction = 'Coming real soon'`
		);
	});
	it('collects external (multiple) css assets', async () => {
		const path = 'externalcss';
		const assets = await navigateAndReturnAssets(path, CollectAssets.collect);
		expect(assets?.css.sheets.length).toBeGreaterThan(1);
	});
	it('collects inline js assets', async () => {
		const path = 'inlinejs';
		const assets = await navigateAndReturnAssets(path, CollectAssets.collect);
		expect(assets?.js.info.scripts[0].text).toMatch(
			`const hello = 'I am an inline script'`
		);
	});
	it('collects inline css assets', async () => {
		const path = 'inlinecss';
		const assets = await navigateAndReturnAssets(path, CollectAssets.collect);
		expect(assets?.css.info.styles[0].text).toMatch(
			`body{background-color: green}`
		);
	});
	it('collects inline assets file size', async () => {
		const path = 'inlinecss'
		const assets = await navigateAndReturnAssets(path, CollectAssets.collect);
		const cssInlineStyle = assets?.css.info.styles[0]
		if (cssInlineStyle) {
			const assetSize = encodeURIComponent(cssInlineStyle.text).replace(/%../g, 'x').length
			expect(cssInlineStyle?.size).toEqual(assetSize)
		}

	})
});

describe('Failed transfer collector', () => {
	it('collects failed requests', async () => {
		const path = '404';
		const assets = await navigateAndReturnAssets(
			path,
			CollectFailedTransfers.collect
		);
		expect(assets?.failed.length).toBeGreaterThan(0);
	});
});

const fetchSpy = jest.spyOn(fetch, 'default')
describe.only('Redirect collector', () => {
	afterEach(() => {
		fetchSpy.mockClear()
	})
	it('collects redirect requests', async () => {
		const path = '305';
		const assets = await navigateAndReturnAssets(path, CollectRedirect.collect);
		expect(assets?.redirect.length).toBeGreaterThan(0);
		expect(assets?.redirect[0].redirectsTo).toMatch(
			'http://localhost:3333/redirected.js'
		);
	});

	it('collects page hosts', async () => {
		const path = 'redirect-host';
		const assets = await navigateAndReturnAssets(path, CollectRedirect.collect);
		expect(assets?.server.hosts.length).toEqual(2);
		expect(assets?.server.hosts[0]).toMatch('localhost');
		expect(assets?.server.hosts[1]).toMatch('mylocalhost');
	});

	it('collects energy source of green hosts', async () => {
		fetchSpy.mockResolvedValueOnce(
			{
				status: 200,
				json: async () => ({
					green: true,
					hostedby: 'you-know'
				})
			} as fetch.Response);
		const path = 'redirect-host'
		const assets = await navigateAndReturnAssets(path, CollectRedirect.collect);
		expect(Object.keys(assets?.server.energySource as {})).toEqual(['isGreen', 'hostedby'])
		expect(assets?.server.energySource?.isGreen).toBe(true)

	})

	it('returns energy source undefined when API response is undefined', async () => {
		fetchSpy.mockRejectedValueOnce({ message: 'undefined' })
		const path = 'redirect-host'
		const assets = await navigateAndReturnAssets(path, CollectRedirect.collect);
		expect(assets?.server.energySource).toBeUndefined()
	})

	it('returns energy source undefined when API response has error', async () => {
		fetchSpy.mockResolvedValueOnce(
			{
				status: 501,
				json: async () => ({
					error: 'Server internal error'
				})
			} as fetch.Response);
		const path = 'redirect-host'
		const assets = await navigateAndReturnAssets(path, CollectRedirect.collect);
		expect(assets?.server.energySource).toBeUndefined()
	})

});

describe('Images collector', () => {
	let assets: CollectMediaTraces | undefined;
	beforeAll(async () => {
		const path = 'images';
		assets = await navigateAndReturnAssets(path, CollectMedia.collect);
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

describe('Videos collector', () => {
	let assets: CollectMediaTraces | undefined;
	beforeAll(async () => {
		const path = 'videos';
		assets = await navigateAndReturnAssets(path, CollectMedia.collect);
	});
	it('collects videos', () => {
		expect(assets?.media.videos.length).toBe(2)
	})
	it('collected videos has src attribute', () => {
		const collectedVideos = assets?.media.videos.map(v => v.src)!
		expect(collectedVideos).toBeTruthy()
		expect(typeof collectedVideos[0]).toBe('object')
	})
})

describe('Lazy images collector', () => {
	it('collects lazy loaded images with page being able to scroll', async () => {
		const path = 'images';
		const assets: CollectLazyMediaTraces | undefined = await navigateAndReturnAssets(
			path,
			CollectLazyMedia.collect
		);
		expect(assets?.lazyMedia.lazyImages.length).toBeGreaterThan(1)
	});
	it('returns undefined with pages unable to scroll', async () => {
		const path = 'unable-to-scroll'
		const assets: CollectLazyMediaTraces | undefined = await navigateAndReturnAssets(
			path,
			CollectLazyMedia.collect
		);

		expect(assets?.lazyMedia).toBe(undefined)
	})
});



describe('Transfer collector', () => {
	let assets: CollectTransferTraces | undefined;

	beforeAll(async () => {
		const path = 'transfer';
		assets = await navigateAndReturnAssets(path, CollectTransfer.collect);
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
			'gzipSize',
			'timestamp'
		]);
	});
	it('collects cdp object', () => {
		expect(Object.keys(assets?.record[0].CDP!)).toEqual(['compressedSize']);
	});
});

describe('Subfont collector', () => {
	let assets: CollectSubfontsTraces | undefined;
	beforeAll(async () => {
		const path = 'fonts';
		assets = await navigateAndReturnAssets(path, CollectSubfont.collect);
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

describe('Cookies collector', () => {
	let assets: CollectCookiesTraces | undefined;
	beforeAll(async () => {
		const path = 'cookies';
		assets = await navigateAndReturnAssets(path, CollectCookies.collect);
	});

	it('works', () => {
		expect(assets?.cookies).toEqual([{
			name: 'fav',
			value: 'true',
			domain: 'localhost',
			expires: -1,
			httpOnly: false,
			path: '/',
			secure: false,
			session: true,
			size: 7
		}])
	})

})
describe('Robots collector', () => {
	let assets: CollectRobotsTraces | undefined;
	const path = '';
	beforeAll(async () => {
		assets = await navigateAndReturnAssets(path, CollectRobots.collect);
	})
	const disallowRules = ['/secret.html/', '/']
	const allowRules = ['/']
	it('collects user agents', () => {
		expect(assets?.robots.agents.all).toBeTruthy()
	})
	it('collects disallow rules', () => {
		expect(assets?.robots.disallow).toEqual(disallowRules)
	})
	it('collects allow rules', () => {
		expect(assets?.robots.allow).toEqual(allowRules)
	})
	it('collects specific user agent rules', () => {
		expect(assets?.robots.agents['Mafiabot'].disallow).toEqual(['/'])
	})
	it('retries on secure domain if previous insecure one is invalid', async () => {
		const invalidUrl = 'http://localhost:2323'
		assets = await navigateAndReturnAssets(path, CollectRobots.collect, invalidUrl)
		expect(assets?.robots).toBeUndefined()
	})
})
describe('Animation collector', () => {
	it('Two animations: one reactive (paused whenever out of viewport) the other not reactive', async () => {
		const path = 'animations'
		const assets: CollectAnimationsTraces | undefined = await navigateAndReturnAssets(path, CollectAnimations.collect);
		expect(assets?.animations?.notReactive.length).toEqual(1)
		expect(assets?.animations?.notReactive[0].name).toBe('slide')
	})
})

describe('Meta tag collector', () => {
	let assets: CollectMetaTagsTraces | undefined;
	const path = 'meta-tags';
	beforeAll(async () => {
		assets = await navigateAndReturnAssets(path, CollectMetaTags.collect);
	})
	it('collects meta tags', () => {
		expect(assets?.metatag.length).toBe(3)
	})
	it('collects robot meta tags', () => {
		const robotsMetaTag = assets?.metatag.filter(meta => {
			if (meta.attr.some(at => at.name === 'robots')) return true
			return false
		})
		expect(robotsMetaTag).toBeTruthy()
	})
})

describe('Screenshot collector', () => {
	let darkmodePower: number | undefined;
	let lightmodePower: number | undefined;
	it('detects dark mode with user sys preferences (prefers color scheme)', async () => {
		const path = 'screenshot-darkmode';
		const assets: CollectScreenShotTraces | undefined = await navigateAndReturnAssets(path, CollectScreenshot.collect)
		darkmodePower = assets?.screenshot.power
		expect(assets?.screenshot.hasDarkMode).toBe(true)
	})
	it('detects absence of dark mode', async () => {
		const path = 'screenshot-no-darkmode'
		const assets: CollectScreenShotTraces | undefined = await navigateAndReturnAssets(path, CollectScreenshot.collect)
		lightmodePower = assets?.screenshot.power
		expect(assets?.screenshot.hasDarkMode).toBe(false)
	})
	it('power in dark mode is less compared to light mode', () => {
		if (darkmodePower && lightmodePower)
			expect(darkmodePower).toBeLessThan(lightmodePower)
	})
})
