import {ClusterOptions, TaskFunctionArguments} from './cluster-settings';
import {Collect, PassContext} from '../collect/collect';
import {Audit} from '../audits/audit';
import {CollectTransfer} from '../collect/transfer.collect';
import {LaunchOptions} from 'puppeteer';

declare global {
	namespace SA {
		namespace Settings {
			export interface DefaultSettings {
				LAUNCH_SETTINGS: LaunchOptions;
				CONNECTION_SETTINGS: ConnectionSettingsPrivate;
				CATEGORIES: {
					server: {description: string};
					design: {description: string};
				};
				AUDITS: CollectorAndAudit;
				REPORT: {
					scoringWeight: {[key: string]: number};
					scoring: Scoring;
					format?: string;
					webhook?: string;
				};
			}

			export interface CollectorAndAudit {
				collectors: any;
				audits: any;
			}

			type CollectorFunction = (
				passContext: TaskFunctionArguments<any>
			) => Promise<any>;
			type AuditFunction = (
				parsedTraces: any
			) => Promise<SA.Audit.Result | undefined> | SA.Audit.Result | undefined;

			export interface ConnectionSettings {
				maxNavigationTime?: number;
				maxScrollInterval?: number;
				emulatedDevice?: EmulatedDevice;
				location?: EmulatedLocation;
			}

			export interface ConnectionSettingsPrivate {
				maxNavigationTime: number;
				maxScrollInterval: number;
				emulatedDevice: EmulatedDevice;
				location: EmulatedLocation;
			}

			export interface Scoring {
				[key: string]: {
					median: number;
					p10: number;
					name: string;
				};
			}
			export interface EmulatedDevice {
				name?: string;
				userAgent: string;
				viewport: Viewport;
			}

			interface EmulatedLocation {
				name?: string;
				latitude: number;
				longitude: number;
				accuracy: number;
			}

			interface Viewport {
				width: number;
				height: number;
			}
		}
	}
}
export {};
