import {ConcurrencyImplementationClassType} from 'puppeteer-cluster/dist/concurrency/ConcurrencyImplementation';
import {LaunchOptions, Page} from 'puppeteer';

export interface ClusterOptions {
	concurrency: number | ConcurrencyImplementationClassType;
	maxConcurrency: number;
	workerCreationDelay: number;
	puppeteerOptions: LaunchOptions;
	perBrowserOptions: LaunchOptions[] | undefined;
	monitor: boolean;
	timeout: number;
	retryLimit: number;
	retryDelay: number;
	skipDuplicateUrls: boolean;
	sameDomainDelay: number;
	puppeteer: any;
}

export interface AuditSettings {
	id?:string
	browser:Browser
	launchSettings?:LaunchOptions
	connectionSettings?:SA.Settings.ConnectionSettings
}

export interface Tracker {
	urls(): void;
	dispose(): void;
}

export interface PageContext{
	page: Page;
	url:string
}
