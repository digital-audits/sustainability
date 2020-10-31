import {LaunchOptions} from 'puppeteer';
import Audit from '../audits/audit';
import Collect from '../collect/collect';

export interface DefaultSettings {
	LAUNCH_SETTINGS: LaunchOptions;
	CONNECTION_SETTINGS: ConnectionSettingsPrivate;
	CATEGORIES: {
		server: {description: string};
		design: {description: string};
	};
	AUDITS: CollectorAndAudit;
	REPORT: {
		scoring: Scoring;
		format?: string;
		webhook?: string;
	};
}

export interface CollectorAndAudit {
	collectors: Array<typeof Collect>;
	audits: Array<typeof Audit>;
}

export interface ConnectionSettings {
	maxNavigationTime?: number;
	maxScrollInterval?: number;
	emulatedDevice?: EmulatedDevice;
	location?: EmulatedLocation;
}

export interface ConnectionSettingsPrivate {
	maxNavigationTime: number;
	maxScrollInterval: number;
	maxScrollWaitingTime: number;
	emulatedDevice: EmulatedDevice;
	location: EmulatedLocation;
	maxThrottle: number;
	streams: boolean;
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
