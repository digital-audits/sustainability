import {LaunchOptions, Page, Browser} from 'puppeteer';
import {ConnectionSettings} from './settings';

export interface AuditSettings {
	/**
	 * Identifier for the current test. Defaults to uuid
	 */
	id?: string;
	/**
	 * Puppeteer browser object. Defaults to a newly instiatiated browser
	 */
	browser?: Browser;
	/**
	 * Puppeteer launch settings. Defaults to puppeteer's
	 */
	launchSettings?: LaunchOptions;
	/**
	 * Sustainability test settings
	 */
	connectionSettings?: ConnectionSettings;
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
