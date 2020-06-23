import {Audit} from './audit';
import {URL} from 'url';
import { debugGenerator } from '../utils/utils';
/**
 * @fileoverview Audits if compression is used. Instead of looking for the content encoding
 *  Response header, which may not reflect the origin server configuration if it serves
 *  the files over a CDN, it takes both compressed and uncompressed file sizes, calculates
 *  the compression ratio and comapres it to the threshold.
 */

const debug = debugGenerator('UsesCompression Audit')
const RATIO_THRESHOLD = 0.95;
const APPLICABLE_COMPRESSION_MIME_TYPES = [
	'text/css',
	'application/javascript',
	'application/x-font-woff',
	'text/javascript',
	'text/html',
	'font/woff',
	'font/ttf',
	'application/json',
	'text/xml', 
	'text/plain',
	'image/svg+xml',
	'image/x-icon'
]
export class UsesCompressionAudit extends Audit {
	static get meta() {
		return {
			id: 'usescompression',
			title: 'Use compression',
			failureTitle: `Don’t use compression`,
			description: `Compression is important because it reduces the total amount of data transferred to clients`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as SA.Audit.Meta;
	}

	static audit(traces: SA.DataLog.Traces): SA.Audit.Result | undefined {
		debug('running')
		const urls = new Set();
		const compressionRatio = (compressed: number, uncompressed: number) =>
			Number.isFinite(compressed) && compressed > 0
				? compressed / uncompressed
				: 1;

		// Filter images and woff font formats.
		// js files considered secure (with identifiable content on HTTPS, e.g personal cookies ) should not be compressed (to avoid CRIME & BREACH attacks)
		let errorMessage = ''
		const hosts = new Set();
		const initialHost = new URL(traces.url).hostname;
		hosts.add(initialHost);

		// Check if there has been a redirect to initial host

		const redirect = traces.redirect?.find(
			record => new URL(record.url).hostname === initialHost
		)?.redirectsTo;

		if (redirect) {
			hosts.add(new URL(redirect).hostname);
		}
		let justOneTime:boolean = true
		const resources = traces.record
			.filter(record => {

				if(!APPLICABLE_COMPRESSION_MIME_TYPES.includes(
					record.response.headers['content-type']
				)) return false

				const size = record.CDP.compressedSize.value;
				const unSize =
					record.response.uncompressedSize.value > 0
						? record.response.uncompressedSize.value
						: 0;
				const ratio = compressionRatio(size, unSize);

				if (ratio < RATIO_THRESHOLD) return false;

				return true;
			})
			.map(record => {
				const isNginx = ()=>{
					if(record.response.headers['server']){
						const server = record.response.headers['server']
						return server.toUpperCase().includes('NGINX')?true:false
					}
					return false
				}
				const url = new URL(traces.url)
				const hostname = new URL(record.request.url).hostname
				
				const isSameHost = Array.from(hosts.values()).includes(hostname)

				if(justOneTime && isSameHost && isNginx()){
					errorMessage = `Possible low gzip compression level detected on NGINX server. Please, consider changing it to at least 5. <a href="https://nginx.org/en/docs/http/ngx_http_gzip_module.html">More info`
					justOneTime=false
				}

				let path = '';

				if (url.pathname) {
					path = url.pathname;

					if (path.length > 30) {
						path = path.slice(0, Math.max(0, path.indexOf('/', 2)));
					}
				}

				const trimUrl = url.hostname + path;

				const resourceType = record.request.resourceType;

				return {
					url: trimUrl,
					resourceType
				};
			})
			.filter(record => {
				if (urls.has(record.url)) return false;
				urls.add(record.url);
				return true;
			});

		const score = Number(resources.length === 0);
		const meta = Audit.successOrFailureMeta(UsesCompressionAudit.meta, score);
		debug('done')
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			extendedInfo: {
				value: Array.from(urls.values())
			},
			errorMessage
		};
	}
}
