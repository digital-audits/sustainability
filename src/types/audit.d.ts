declare global {
	namespace SA.Audit {
		export interface Meta {
			/** String identifier of the audit */
			id: string;
			/** Short successful audit title */
			title?: string;
			/** Short failed audit title */
			failureTitle?: string;
			/** Audit description, showcasinng importance and useful information */
			description: string;
			/** Audit category: Server or Design */
			category: 'server' | 'design';
			/** Traces names this audit requires */
			collectors: Array<ScoreWeights>;
		}
		export type ScoreDisplayMode = 'numeric' | 'binary' | 'skip';

		export type ScoreWeights =
			'transfercollect'
			| 'redirectcollect'
			| 'failedtransfercollect'
			| 'htmlcollect'
			| 'jscollect'
			| 'subfontcollect'
			| 'performancecollect'
			| 'imagescollect'
			| 'consolecollect'
			| 'assetscollect'
			

		export interface Result {
			score?: number;
			scoreDisplayMode: ScoreDisplayMode;
			meta: Meta;
			extendedInfo?: {value: ExtendedInfo};
			errorMessage?: string;
		}

		export interface ExtendedInfo {
			[key: string]: any;
		}

		export interface AuditsByCategory {
			category: AuditCategoryAndDescription;
			score: number | null;
			audits: AuditByFailOrPass;
		}

		export interface AuditCategoryAndDescription {
			name: 'server' | 'design';
			description: string;
		}

		export interface AuditByFailOrPassOrSkip {
			pass: AuditReportFormat[];
			fail: AuditReportFormat[];
			skip: SkippedAuditReportFormat[]
		}

		export interface AuditReportFormat {
			title: string;
			score: number;
			scoreDisplayMode: ScoreDisplayMode;
			meta: Meta;
			extendedInfo?: {value: ExtendedInfo};
			errorMessage?: string;
		}

		export interface SkippedAuditReportFormat {
			meta:Meta
		}
	}
}

export {};
