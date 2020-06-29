import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {DEFAULT} from '../settings/settings';
import {Request} from 'puppeteer';

const debug = util.debugGenerator('Transfer collect');
export default class CollectTransfer extends Collect {
	collectId: SA.Audit.CollectorsIds = 'transfercollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<SA.Traces.CollectTransferTraces | undefined> {
		try {
			debug('running');
			const {page} = pageContext;
			const results: SA.Traces.Record[] = [];
			const protocol: SA.Traces.ProtocolData[] = [];
			const CDP: SA.Traces.CDPDataPrivate[] = [];
			const lazyImages: string[] = [];
			const client = await page.target().createCDPSession();
			await client.send('Network.enable');

			client.on('Network.loadingFinished', (data: any) => {
				if (data?.encodedDataLength) {
					const {requestId, encodedDataLength} = data;
					CDP.push({
						requestId,
						encodedDataLength
					});
				}
			});

			client.on('Network.responseReceived', (data: any) => {
				if (data?.response) {
					protocol.push({
						protocol: data.response.protocol,
						requestId: data.requestId
					});
				}
			});

			page.on('requestfinished', async (request: Request) => {
				const response = request.response();
				let responseBody: Buffer;
				let uncompressedSize: SA.Traces.ByteFormat;
				// Body can only be accessed for non-redirect responses
				if (response) {
					try {
						responseBody = await response.buffer();
						uncompressedSize = {
							value: responseBody.length,
							units: 'bytes'
						};
					} catch (error) {
						const contentLengthFromResponseHeader = response.headers()[
							'content-length'
						];
						if (contentLengthFromResponseHeader) {
							uncompressedSize = {
								value: Number(contentLengthFromResponseHeader),
								units: 'bytes'
							};
						} else {
							uncompressedSize = {
								value: 0,
								units: 'bytes'
							};
						}

						debug('failed at redirect response');
						util.log(
							`Error: Transfer collect failed with message: ${error.message}`
						);
					}

					// @ts-ignore
					const requestId = request._requestId;
					const information: SA.Traces.Record = {
						request: {
							requestId,
							url: new URL(request.url()),
							resourceType: request.resourceType(),
							method: request.method(),
							headers: request.headers(),
							timestamp: Date.now(),
							protocol: protocol.find(p => p.requestId === requestId)?.protocol
						},
						response: {
							remoteAddress: response.remoteAddress(),
							status: response.status(),
							url: new URL(response.url()),
							fromServiceWorker: response.fromServiceWorker(),
							headers: response.headers(),
							uncompressedSize,
							timestamp: Date.now()
						},
						CDP: {
							compressedSize: {
								value:
									CDP.find((r: any) => r.requestId === requestId)
										?.encodedDataLength ?? 0,
								units: 'bytes'
							}
						}
					};
					results.push(information);
				}
			});
			const requestListener = () => {
				page.on('requestfinished', (request: Request) => {
					if (request.resourceType() === 'image') {
						lazyImages.push(request.url());
					}
				});
			};

			await util.safeNavigateTimeout(page, 'networkidle0', debug);

			requestListener();
			await util.scrollFunction(
				page,
				DEFAULT.CONNECTION_SETTINGS.maxScrollInterval,
				debug
			);
			debug('done scrolling');

			debug('done');
			return {
				record: results,
				lazyImages
			};
		} catch (error) {
			util.log(`Error: Transfer collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
