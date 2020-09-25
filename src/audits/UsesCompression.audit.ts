import Audit from './audit';
import * as util from '../utils/utils';
import {Traces} from '../types/traces';
import {Meta, SkipResult, Result} from '../types/audit';
/**
 * @fileoverview Audits if compression is used. Instead of looking for the content encoding
 *  Response header, which may not reflect the origin server configuration if it serves
 *  the files over a CDN, it takes both compressed and uncompressed file sizes, calculates
 *  the compression ratio and comapres it to the threshold.
 */

// const IGNORE_THRESHOLD_BYTES = 1400; gzipSavings (gzip - original: TODO)
const IGNORE_THRESHOLD_PERCENT = 0.1;

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
export default class UsesCompressionAudit extends Audit {
	static get meta() {
		return {
			id: 'usescompression',
			title: 'Use compression',
			failureTitle: `Don’t use compression`,
			description: `Text compression is important because it reduces the total amount of data transferred to clients`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult | undefined {
		const debug = util.debugGenerator('UsesCompression Audit');
		debug('running');
		const auditUrls = new Set();
		/* Const compressionSavings = (compressed: number, uncompressed: number) =>
			uncompressed - compressed
*/
		// js files considered secure (with identifiable content on HTTPS, e.g personal cookies )
		// should not be compressed (to avoid CRIME & BREACH attacks)
		let errorMessage: string | undefined;
		const {hosts} = traces;
		let justOneTime = true;
		const resources = traces.record
			.filter(record => {
				const compressedSize = record.CDP.compressedSize.value;
				const originalSize = record.response.uncompressedSize.value;

				if (!compressedSize || compressedSize < 0) return false;
				if (
					1 - compressedSize / originalSize >
					IGNORE_THRESHOLD_PERCENT
					// || compressionSavings(compressedSize, originalSize) > IGNORE_THRESHOLD_BYTES
				)
					return false;

				const recordUrl = record.request.url;
				if (!hosts.includes(recordUrl.hostname)) return false;
				if (
					!APPLICABLE_COMPRESSION_MIME_TYPES.includes(
						record.response.headers['content-type']
					)
				)
					return false;
				console.log(
					compressedSize,
					originalSize,
					record.request.url,
					record.response.headers['content-type']
				);

				return true;
			})
			.map(record => {
				const isNginx = () => {
					if (record.response.headers.server) {
						const server = record.response.headers.server;
						return server.toUpperCase().includes('NGINX');
					}

					return false;
				};

				const recordUrl = record.request.url;

				if (justOneTime && isNginx()) {
					errorMessage = `Possible low gzip compression level detected on NGINX server. Please, consider changing it to at least 5. <a href="https://nginx.org/en/docs/http/ngx_http_gzip_module.html">More info`;
					justOneTime = false;
				}

				let path = '';
				if (recordUrl.pathname) {
					path = recordUrl.pathname;

					if (path.length > 30) {
						path = path.slice(0, Math.max(0, path.indexOf('/', 2)));
					}
				}

				const trimUrl = recordUrl.hostname + path;

				return {
					url: trimUrl
				};
			})
			.filter(record => {
				if (auditUrls.has(record.url)) return false;
				auditUrls.add(record.url);
				return true;
			});

		const score = Number(resources.length === 0);
		const meta = util.successOrFailureMeta(UsesCompressionAudit.meta, score);
		debug('done');
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			...(auditUrls.size > 0
				? {
						extendedInfo: {
							value: Array.from(auditUrls.values())
						}
				  }
				: {}),
			...(errorMessage ? {errorMessage} : {})
		};
	}
}
