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

const APPLICABLE_COMPRESSION_MIME_TYPES = [
	'text/css',
	'text/javascript',
	'text/html',
	'text/xml',
	'text/plain',
	'application/javascript',
	'application/x-font-woff',
	'application/x-javascript',
	'application/vnd.ms-fontobject',
	'application/x-font-opentype',
	'application/x-font-truetype',
	'application/x-font-ttf',
	'application/xml',
	'application/json',
	'application/font-sfnt',
	'font/eot',
	'font/opentype',
	'font/otf',
	'font/woff',
	'font/ttf',
	'image/svg+xml',
	'image/x-icon',
	'image/vnd.microsoft.icon'
];
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
				if (data?.response && data.response.protocol) {
					protocol.push({
						protocol: data.response.protocol,
						requestId: data.requestId
					});
				}
			});

			page.on('requestfinished', async (request: Request) => {
				const response = request.response();
				const responseHeaders = response?.headers()!
				let responseBody: Buffer;
				let uncompressedSize: ByteFormat;
				let gzipSize: ByteFormat
				
				if (response) {
					try {
						responseBody = await response.buffer();
						if(APPLICABLE_COMPRESSION_MIME_TYPES.includes(
							responseHeaders['content-type']
						)){
						const gzipSizeValue = async (bodyBuffer:Buffer) => await page.evaluate(async (input)=>{
							const str2ab= (str:string)=>{
								
							var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
							var bufView = new Uint16Array(buf);
							for (var i = 0, strLen = str.length; i < strLen; i++) {
								bufView[i] = str.charCodeAt(i);
								}
							return buf;
								  
							}
							//@ts-ignore
							const cs = new CompressionStream('gzip')
							const writer = cs.writable.getWriter();
							writer.write(str2ab(input));
							writer.close();
							let totalSize = 0;
							const reader = cs.readable.getReader();
							while (true) {
								const { value, done } = await reader.read();
								if (done)
								  break;
								totalSize += value.byteLength;
							  }

							return totalSize

						}, bodyBuffer.toString('utf-8'))
						gzipSize = {
							value: await gzipSizeValue(responseBody),
							units: 'bytes'
						}

					
					}else{
						gzipSize = {
							value: 0,
							units:'bytes'
						}
					}
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

						gzipSize = {
							value: 0,
							units:'bytes'
						}

						debug('failed at redirect response');
						util.log(
							`Error: Transfer collect failed at ${request.url()} with message: ${error.message}`
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
							headers: responseHeaders,
							uncompressedSize,
							gzipSize,
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
