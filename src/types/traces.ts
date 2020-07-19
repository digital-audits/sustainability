export interface Format {
	uid: string;
	url: string;
	monitor: MonitorStats[];
	completed: boolean;
	traces: Traces;
}

export interface MonitorStats {
	id: string;
	cpu: number;
	memory: number;
	timestamp: number | [number, number];
}

export interface Traces {
	hosts: string[];
	html: string[];
	css: CssTrace;
	js: JsTrace;
	record: Record[];
	console: ConsoleMessageFormat[];
	performance: PerformanceFormat;
	fonts: SubfontFormat[];
	media: MediaTrace;
	failed: FailedRequest[];
	redirect: RedirectResponse[];
	lazyImages: string[];
}

export interface MediaTrace {
	images: ImageFormat[];
}

export interface ImageFormat {
	[key: string]: string | boolean;
}

export interface ConsoleMessageFormat {
	type: string;
	text: string;
}

export interface PerformanceFormat {
	perf: Performance;
	metrics: Metrics;
}

export type SubfontFormat = {
	name: string;
	value: FontInformation
};

export interface GHOutput{
	[key:string]:FontInformation
}

export interface FontInformation{
	glyphs: string[],
	weights: number[],
	styles: string[]
}

export interface Metrics {
	/** The timestamp when the metrics sample was taken. */
	Timestamp: number;
	/** Number of documents in the page. */
	Documents: number;
	/** Number of frames in the page. */
	Frames: number;
	/** Number of events in the page. */
	JSEventListeners: number;
	/** Number of DOM nodes in the page. */
	Nodes: number;
	/** Total number of full or partial page layout. */
	LayoutCount: number;
	/** Total number of page style recalculations. */
	RecalcStyleCount: number;
	/** Combined durations of all page layouts. */
	LayoutDuration: number;
	/** Combined duration of all page style recalculations. */
	RecalcStyleDuration: number;
	/** Combined duration of JavaScript execution. */
	ScriptDuration: number;
	/** Combined duration of all tasks performed by the browser. */
	TaskDuration: number;
	/** Used JavaScript heap size. */
	JSHeapUsedSize: number;
	/** Total JavaScript heap size. */
	JSHeapTotalSize: number;
}

export interface CssTrace {
	sheets: Sheets[];
	info: StyleInfo;
}

export interface Sheets {
	url: string;
	text: string;
}

export interface Scripts {
	url: string;
	text: string;
}

export interface StyleInfo {
	styleHrefs: Stylesheets[];
	styles: InlineStyles[];
}

export interface Stylesheets {
	href: string;
	attr: string[];
}

export interface InlineStyles {
	href: string;
	text: string;
}

export interface JsTrace {
	scripts: Scripts[];
	info: ScriptInfo;
}

export interface ScriptInfo {
	scriptSrcs: Scriptfiles[];
	scripts: InlineScripts[];
}
export interface Scriptfiles {
	src: string;
	attr: string[];
}

export interface InlineScripts {
	src: string;
	text: string;
}

export interface Record {
	request: Request;
	response: Response;
	CDP: CDPData;
}

export interface RequestResponse {
	request: Request;
	response: Response;
}

export interface ProtocolData {
	protocol: string;
	requestId: string;
}

export interface CDPDataPrivate {
	requestId: string;
	encodedDataLength: number;
}

export interface Request {
	requestId: string;
	url: URL;
	resourceType: ResourceType;
	method: HttpMethod;
	headers: Headers;
	protocol?: string;
	timestamp: number;
}
export type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PATCH'
	| 'PUT'
	| 'DELETE'
	| 'OPTIONS';

export type ResourceType =
	| 'document'
	| 'stylesheet'
	| 'image'
	| 'media'
	| 'font'
	| 'script'
	| 'texttrack'
	| 'xhr'
	| 'fetch'
	| 'eventsource'
	| 'websocket'
	| 'manifest'
	| 'other';
export type Headers = {
	[x: string]: string;
};
export type ByteUnits = 'bytes' | 'kb' | 'mb' | 'gb';

export interface Response {
	remoteAddress: HostAddress;
	status: number;
	url: URL;
	fromServiceWorker: boolean;
	headers: Headers;
	uncompressedSize: ByteFormat;
	timestamp: number;
}

export interface ByteFormat {
	value: number;
	units: ByteUnits;
}

export interface SecurityDetails {
	subjectName: string;
	issuer: string;
	validFrom: number;
	validTo: number;
	protocol: string;
}
export interface HostAddress {
	ip: string;
	port: number;
}

export interface CDPData {
	compressedSize: ByteFormat;
}

export interface FailedRequest {
	url: string;
	code: number;
	failureText?: string | undefined;
	requestId: string;
}

export interface RedirectResponse {
	requestId: string;
	url: string;
	redirectsTo: string;
}

/**
	Return Types for Collectors
*/
export interface CollectAssetsTraces {
	css: CssTrace;
	js: JsTrace;
}

export interface CollectConsoleTraces {
	console: ConsoleMessageFormat[];
}

export interface CollectFailedTransferTraces {
	failed: FailedRequest[];
}

export interface CollectHtmlTraces {
	html: string[];
}
export interface CollectImagesTraces {
	media: MediaTrace;
}

export interface CollectPerformanceTraces {
	performance: PerformanceFormat;
}

export interface CollectRedirectTraces {
	redirect: RedirectResponse[];
	hosts: string[];
}

export interface CollectSubfontsTraces {
	fonts: SubfontFormat[];
}

export interface CollectTransferTraces {
	record: Record[];
}

export interface CollectLazyImagesTraces {
	lazyImages: string[];
}
