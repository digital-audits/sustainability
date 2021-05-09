import { LoadEvent } from 'puppeteer';

export interface Meta {
	/** String identifier of the audit */
	id: string;
	/** Short successful audit title */
	title: string;
	/** Short failed audit title */
	failureTitle: string;
	/** Audit description, showcasinng importance and useful information */
	description: string;
	/** Audit category: Server or Design */
	category: 'server' | 'design';
	/** Traces names this audit requires */
	collectors: CollectorsIds[];
}
export type ScoreDisplayMode = 'numeric' | 'binary' | 'skip';

export type CollectorsIds =
	| 'transfercollect'
	| 'redirectcollect'
	| 'failedtransfercollect'
	| 'htmlcollect'
	| 'jscollect'
	| 'subfontcollect'
	| 'performancecollect'
	| 'imagescollect'
	| 'consolecollect'
	| 'assetscollect'
	| 'screenshotcollect'
	| 'animationscollect'
	| 'mediacollect'
	| 'lazymediacollect'
	| 'metatagscollect'
	| 'robotscollect'
	| 'cookiescollect'

export type PassContext =
	| 'beforenavigation'
	| 'navigation'
	| SelectorContext
	| LoadEvent
	| 'afternavigation';
export interface SelectorContext {
	selector: string;
}

export interface Result {
	score: number;
	scoreDisplayMode: ScoreDisplayMode;
	meta: SuccessOrFailureMeta;
	extendedInfo?: { value: ExtendedInfo };
	errorMessage?: string;
}

export interface CollectMeta {
	id: CollectorsIds;
	passContext?: PassContext;
	debug: debug.Debugger;
}

export interface SuccessOrFailureMeta {
	/** String identifier of the audit */
	id: string;
	/** Short successful or failure audit title */
	title: string;
	/** Audit description, showcasinng importance and useful information */
	description: string;
	/** Audit category: Server or Design */
	category: 'server' | 'design';
}

export interface SkipResult {
	scoreDisplayMode: ScoreDisplayMode;
	meta: SkipMeta;
	extendedInfo?: { value: ExtendedInfo };
	errorMessage?: string;
}

export interface ExtendedInfo {
	[key: string]: any;
}

export interface AuditReportMeta {
	url: string;
	timing: Array<string | number>;
}

export interface Report {
	comments?: string[];
	globalScore: number;
	meta: AuditReportMeta;
	audits: AuditsByCategory[];
}

export interface ErrorMsg {
	error: string;
}

export interface AuditsByCategory {
	category: AuditCategoryAndDescription;
	score: number | null;
	audits: AuditByFailOrPassOrSkip;
}

export interface AuditCategoryAndDescription {
	name: 'server' | 'design';
	description: string;
}

export interface AuditByFailOrPassOrSkip {
	pass: AuditReportFormat[];
	fail: AuditReportFormat[];
	skip: SkippedAuditReportFormat[];
}

export interface AuditReportFormat {
	score: number;
	scoreDisplayMode: ScoreDisplayMode;
	meta: Meta;
	extendedInfo?: { value: ExtendedInfo };
	errorMessage?: string;
}

export interface SkippedAuditReportFormat {
	meta: SkipMeta;
	scoreDisplayMode: ScoreDisplayMode;
}

export interface SkipMeta {
	/** String identifier of the audit */
	id: string;
	/** Audit category: Server or Design */
	category: 'server' | 'design';
	/** Audit description, showcasinng importance and useful information */
	description: string;
}
