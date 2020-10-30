import {LaunchOptions, Page, Browser} from 'puppeteer';
import {ConnectionSettings} from './settings';

export interface AuditSettings {
	id?: string;
	browser?: Browser;
	page?: Page;
	launchSettings?: LaunchOptions;
	connectionSettings?: ConnectionSettings;
	streams?:boolean
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
