import {PageContext} from '../types';
import {CollectorsIds} from '../types/audit';
import Collect from './collect';
import * as util from '../utils/utils';
import {CollectScreenShotTraces, RGBPowerFormat} from '../types/traces';
import {ConnectionSettingsPrivate} from '../types/settings';

const BLUE_CHANNEL_POWER = 6;
const RED_CHANNEL_POWER = 2.5;
const GREEN_CHANNEL_POWER = 2.5;
const SCREENSHOT_SIMILARITY_THRESHOLD = 0.9;

export default class CollectScreenshot extends Collect {
	static get meta() {
		return {
			id:'screenshotcollect',
			passContext: 'networkidle0',
			debug:util.debugGenerator('Screenshot collect'),
		}
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectScreenShotTraces | undefined> {
		try {
			const debug = CollectScreenshot.meta.debug
			debug('running');
			const {page, url} = pageContext;
			const rgbPower: RGBPowerFormat = {
				r: RED_CHANNEL_POWER,
				g: GREEN_CHANNEL_POWER,
				b: BLUE_CHANNEL_POWER
			};
			// Wait until domcontentloaded to avoid screenshot of cookie banner
			await util.safeNavigateTimeout(
				page,
				'domcontentloaded',
				settings.maxNavigationTime
			);
			const base64Screenshot = await page.screenshot({encoding: 'base64'});
			const darkModePage = await page.browser().newPage();

			await Promise.all([
				darkModePage.emulateMediaFeatures([
					{
						name: 'prefers-color-scheme',
						value: 'dark'
					}
				]),
				darkModePage.setUserAgent(settings.emulatedDevice.userAgent),
				darkModePage.setViewport(settings.emulatedDevice.viewport),
				darkModePage.setCacheEnabled(false),
				darkModePage.setBypassCSP(true)
			]);

			const darkModePageContext = {page: darkModePage, url};
			await Promise.race([
				util.navigate(darkModePageContext, 'domcontentloaded', debug),
				util.safeNavigateTimeout(
					darkModePage,
					'domcontentloaded',
					settings.maxNavigationTime
				)
			]);
			const base64ScreenshotDark = await darkModePage.screenshot({
				encoding: 'base64'
			});

			await Promise.all([page.bringToFront(), darkModePage.close()]);

			const RGBPixelPower = async (
				screenshot: string,
				rgbPower: RGBPowerFormat
			) =>
				page.evaluate(
					async function(base64Screenshot, rgbPower) {
						const image = new Image();
						const imgLoadPromise = async function() {
							return new Promise((resolve, reject) => {
								image.addEventListener('load', () => {
									debug('Image successfully loaded into DOM');
									return resolve;
								});

								image.addEventListener('error', reject);
							});
						};

						image.src = 'data:image/png;base64,' + base64Screenshot;
						await imgLoadPromise; // Dont ever end with ()

						//  Console.log('DARK',window.matchMedia('(prefers-color-scheme: light)').matches
						// )

						const canvas = document.createElement(
							'CANVAS'
						) as HTMLCanvasElement;
						const context = canvas.getContext('2d');

						const width = image.naturalWidth;
						const height = image.naturalHeight;
						canvas.width = width;
						canvas.height = height;
						context!.drawImage(image, 0, 0);
						const data = context!.getImageData(0, 0, width, height).data;
						const pixels = data.length / 4;

						const average = {r: 0, g: 0, b: 0, pixels};

						for (let i = 0; i < data.length; i += 4) {
							average.r += data[i];
							average.g += data[i + 1];
							average.b += data[i + 2];
						}

						average.r = Math.floor(average.r / pixels) / 255;
						average.g = Math.floor(average.g / pixels) / 255;
						average.b = Math.floor(average.b / pixels) / 255;

						const pixelPower = JSON.parse(rgbPower);
						return (
							(average.pixels *
								(average.r * pixelPower.r +
									average.b * pixelPower.b +
									average.g * pixelPower.g)) /
							1000000
						);
					},
					screenshot,
					JSON.stringify(rgbPower)
				);

			debug('Evaluating pixel power');
			const shPromises = await Promise.all([
				RGBPixelPower(base64Screenshot, rgbPower),
				RGBPixelPower(base64ScreenshotDark, rgbPower)
			]);

			debug(`white: ${shPromises[0]}, dark:${shPromises[1]}`);

			const hasDarkMode =
				shPromises[1] < shPromises[0] &&
				1 - Math.abs(shPromises[0] - shPromises[1]) / Math.max(...shPromises) <=
					SCREENSHOT_SIMILARITY_THRESHOLD;

			debug(`Page has dark mode option: ${hasDarkMode}`);
			debug('done');
			return {
				screenshot: {
					power: hasDarkMode ? shPromises[1] : shPromises[0],
					hasDarkMode
				}
			};
		} catch (error) {
			util.log(`Error: Screenshot collect failed with message: ${error}`);
			return undefined;
		}
	}
}
