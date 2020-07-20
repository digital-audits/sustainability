import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {Request} from 'puppeteer';
import {
	CollectTransferTraces,
	ProtocolData,
	CDPDataPrivate,
	Record,
	ByteFormat
} from '../types/traces';
import {CollectorsIds} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';

export default class CollectTransfer extends Collect {
	collectId: CollectorsIds = 'transfercollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectTransferTraces | undefined> {
		try {
			const debug = util.debugGenerator('Transfer collect');
			debug('running');
			const {page} = pageContext;
			const results: Record[] = [];
			const protocol: ProtocolData[] = [];
			const CDP: CDPDataPrivate[] = [];
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
				let uncompressedSize: ByteFormat;
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
					const information: Record = {
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

			debug('done');

			return {
				record: results
			};
		} catch (error) {
			util.log(`Error: Transfer collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
