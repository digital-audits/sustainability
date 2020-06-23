import {Page} from 'puppeteer';

/**
 *
 * @file We could have used JSHeapMemory but it shows inconsistent results that cannot
 *       be attributed to our code.
 */
/**
 *
 * @param page Puppeteer's Page Object
 * @param testFunction function to test for memory leaks
 * @returns true if memory leak detected false otherwise
 */

export default async function measure(
	page: Page,
	testFunction: CallableFunction
): Promise<boolean> {
	const initialObjectsNumber = await countObjects(page);
	await Reflect.apply(testFunction, null, arguments);
	const finalObjectsNumber = await countObjects(page);

	return initialObjectsNumber === finalObjectsNumber;
}

// From https://github.com/chrisguttandin/standardized-audio-context/blob/master/test/memory/module.js

/**
 *
 * @param page Puppeteer Page Object
 * @returns number of total objects
 */
export const countObjects = async (page: Page): Promise<number> => {
	const prototypeHandle = await page.evaluateHandle(() => Object.prototype);
	const objectsHandle = await page.queryObjects(prototypeHandle);
	const numberOfObjects = await page.evaluate(
		instances => instances.length,
		objectsHandle
	);

	await Promise.all([prototypeHandle.dispose(), objectsHandle.dispose()]);

	return numberOfObjects;
};
