import * as Debug from 'debug';
import { Page, LoadEvent } from 'puppeteer';
import { PromiseAllSettledFulfilled, PromiseAllSettledRejected, Tracker } from '../types/index';
import memoizee = require('memoizee');
export declare function debugGenerator(namespace: string): Debug.IDebugger;
export declare function log(msg: string): void;
export declare function toHexString(codePointArray: Array<number>): Array<string>;
export declare function scrollFunction(page: Page, maxScrollInterval: number, debug?: CallableFunction): Promise<any>;
export declare function parseAllSettled(data: Array<PromiseAllSettledRejected | PromiseAllSettledFulfilled>, audit?: boolean): any;
export declare function safeReject(error: Error, tracker?: Tracker): void;
export declare function createTracker(page: Page): Tracker;
interface APIResponse {
    green: boolean;
    url: string;
    hostedby: string;
    hostedbywebsite: string;
}
export declare const isGreenServerMem: ((ip: string) => Promise<APIResponse | undefined>) & memoizee.Memoized<(ip: string) => Promise<APIResponse | undefined>>;
export declare function safeNavigateTimeout(page: Page, waitUntil: LoadEvent, debug?: CallableFunction, cb?: CallableFunction): Promise<unknown>;
export declare function generate(): string;
export default function measure(page: Page, testFunction: CallableFunction): Promise<boolean>;
/**
 *
 * @param page Puppeteer Page Object
 * @returns number of total objects
 */
export declare const countObjects: (page: Page) => Promise<number>;
/**
 * Credits to Google Lighthouse
 *
 * Computes a score between 0 and 1 based on the measured `value`. Score is determined by
 * considering a log-normal distribution governed by two control points (the 10th
 * percentile value and the median value) and represents the percentage of sites that are
 * greater than `value`.
 *
 */
export declare function computeLogNormalScore(controlPoints: {
    median: number;
    p10: number;
}, value: number): number;
export declare const clampTo2Decimals: (value: number) => number;
/**
 * @description Computes a global calculated as the average sum of category scores.
*/
export declare function computeScore(audits: any): number;
export declare function groupAudits(list: SA.Audit.Result[]): SA.Audit.AuditsByCategory[];
export declare function successOrFailureMeta(meta: SA.Audit.Meta, score: number): {
    id: string;
    description: string;
    category: "server" | "design";
    title: string | undefined;
};
export declare function skipMeta(meta: SA.Audit.Meta): {
    id: string;
    category: "server" | "design";
    description: string;
};
export declare function failed(score: number): boolean;
export declare function successOrFailureOrSkipAudits(audits: SA.Audit.AuditReportFormat[]): SA.Audit.AuditByFailOrPassOrSkip;
export {};
