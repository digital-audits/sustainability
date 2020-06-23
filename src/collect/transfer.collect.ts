import {Collect} from './collect';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';
import { PageContext } from '../types/cluster-settings';
import { debugGenerator , log, scrollFunction} from '../utils/utils';
import { DEFAULT } from '../settings/settings';
import { Request } from 'puppeteer';


const debug = debugGenerator('Transfer collect')
export class CollectTransfer extends Collect {
	private static collectId:string='transfercollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext) {
		try {
			debug('running')
			const {page, url} = pageContext;
			const results: any = [];
			const protocol: any = [];
			const CDP: any = [];
			const client = await page.target().createCDPSession()
			await client.send('Network.enable')
			
			client.on('Network.loadingFinished', (data: any) => {
				if (data?.encodedDataLength) {
					const {requestId, encodedDataLength} = data;
					CDP.push({requestId, encodedDataLength});
				}
			});

			client.on('Network.responseReceived', (data: any) => {
				if (data?.response) {
					protocol.push({
						protocol: data.response.protocol,
						reqId: data.requestId
					});
				}
			});

			page.on('requestfinished', async (request: Request) => {
				const response = request.response();
				let responseBody;
				let uncompressedSize;
				// Body can only be accessed for non-redirect responses
				if(response){
					try {
						responseBody = await response.buffer();
						uncompressedSize = {
							value: responseBody.length,
							units: 'bytes'
						}
					} catch (error) {
						const contentLengthFromResponseHeader = response.headers()['content-length']
						if(contentLengthFromResponseHeader){
							uncompressedSize = {
								value: +contentLengthFromResponseHeader,
								units: 'bytes'
							}
						}else{
							uncompressedSize = {
								value: 0,
								units: 'bytes'
							}
						}
						debug('failed at redirect response')
						log(`Error: Transfer collect failed with message: ${error.message}`)
					}

				const information = {
					request: {
						//	@ts-ignore
						requestId: request._requestId,
						url: request.url(),
						resourceType: request.resourceType(),
						method: request.method(),
						headers: request.headers(),
						timestamp: Date.now()
					},
					response: {
						remoteAddress: response.remoteAddress(),
						status: response.status(),
						url: response.url(),
						fromDiskCache: response.fromCache(),
						fromServiceWorker: response.fromServiceWorker(),
						headers: response.headers(),
						securityDetails: response.securityDetails(),
						uncompressedSize: uncompressedSize,
						timestamp: Date.now()
					}
				};
				results.push(information);
			}
			});

			await Promise.all([
				scrollFunction(page, DEFAULT.CONNECTION_SETTINGS.maxScrollInterval, debug).
				then(()=>debug('done scrolling')),
				safeNavigateTimeout(page, 'networkidle0', debug)
			])
			results.map((info: any) => {
				info.request.protocol = protocol.find(
					(p: any) => p.reqId === info.request.requestId
				)?.protocol;
				info.CDP = {
					compressedSize: {
						value:
							CDP.find((r: any) => r.requestId === info.request.requestId)
								?.encodedDataLength || 0,
						units: 'bytes'
					}
				};
				return {
					info
				};
			});
			debug('done')
			return {
				url,
				record: results
			};
		} catch (error) {
			log(`Error: Transfer collect failed with message: ${error.message}`)
			return undefined;
		}
	}
}
