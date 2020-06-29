import {ConcurrencyImplementationClassType} from 'puppeteer-cluster/dist/concurrency/ConcurrencyImplementation';
import {LaunchOptions, Page, Browser} from 'puppeteer';

export interface AuditSettings {
	id?: string;
	browser?: Browser;
	page?: Page;
	launchSettings?: LaunchOptions;
	connectionSettings?: SA.Settings.ConnectionSettings;
}

export interface Tracker {
	urls(): string[];
	dispose(): void;
}

export interface PageContext {
	page: Page;
	url: string;
}

export interface PromiseAllSettledFulfilled {
	status: 'fulfilled';
	value: Record<string, unknown>;
}

export interface PromiseAllSettledRejected {
	status: 'rejected';
	reason: Error;
}
