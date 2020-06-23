import {getLogNormalScore, sum, groupBy} from '../bin/statistics';
import {DEFAULT} from '../settings/settings';

export class Audit {
	static get meta(): SA.Audit.Meta {
		return {} as SA.Audit.Meta;
	}

	static audit(
		traces: SA.DataLog.Traces
	): Promise<SA.Audit.Result | undefined> | SA.Audit.Result | undefined {
		return {} as SA.Audit.Result;
	}

	/**
	 * Credits to Google Lighthouse
	 *
	 * Computes a score between 0 and 1 based on the measured `value`. Score is determined by
	 * considering a log-normal distribution governed by two control points (the 10th
	 * percentile value and the median value) and represents the percentage of sites that are
	 * greater than `value`.
	 * @param {{median: number, p10: number}} controlPoints
	 * @param {number} value
	 * @return {number}
	 */
	static computeLogNormalScore(
		controlPoints: {median: number; p10: number},
		value: number
	): number {
		const percentile = getLogNormalScore(controlPoints, value);

		return Audit.clampTo2Decimals(percentile);
	}

	static clampTo2Decimals = (value: number) => Math.round(value * 100) / 100;

	/**
	 * @description Computes a global calculated as the average sum of category scores.
	 *
	 * @param audits @type {category:string, score:number, audits: SA.Audits.Result[]}[]
	 * @returns {number} A score between [0-100]
	 */
	static computeScore(audits: any) {
		return Math.round(sum(audits.map((audit: any) => audit.score)) / 2);
	}

	static groupAudits(list: SA.Audit.Result[]): SA.Audit.AuditsByCategory[] {
		const resultsGrouped = groupBy(list, (audit: SA.Audit.Result) => audit.meta.category);

		const audits = Array.from(resultsGrouped.keys()).map(
			(key: 'server' | 'design') => {
				const groupByKey = resultsGrouped.get(key)
				const auditsByFailOrPassOrSkip = Audit.successOrFailureOrSkipAudits(groupByKey);
				const groupByKeyNonSkip = groupByKey.filter((result:SA.Audit.Result)=>result.scoreDisplayMode!=='skip');
				const auditScoreRaw =
					sum(groupByKeyNonSkip.map((result: SA.Audit.Result) => result.score)) /
					groupByKeyNonSkip.length;
				const auditScore = Math.round(auditScoreRaw * 100);
				const catDescription = DEFAULT.CATEGORIES[key].description;
				

				return {
					category: {name: key, description: catDescription},
					score: auditScore,
					audits: auditsByFailOrPassOrSkip
				};
			}
		);

		return audits;
	}

	static successOrFailureMeta(meta: SA.Audit.Meta, score: number) {
		const {title, failureTitle, ...output} = meta;

		if (Audit.failed(score)) {
			return {title: failureTitle, ...output};
		}

		return {title, ...output};
	}

	static failed(score: number) {
		if (score === 0 || score <= 0.49) {
			return true;
		}

		return false;
	}

	static successOrFailureOrSkipAudits(
		audits: SA.Audit.AuditReportFormat[]
	): SA.Audit.AuditByFailOrPassOrSkip {
		const out = audits.reduce(
			(object, v) => {
				const skipAudit = v.scoreDisplayMode === 'skip';
				(skipAudit ? object.skip : Audit.failed(v.score) ? object.fail : object.pass).push(v);
				return object;
			},
			{pass: [], fail: [], skip: []} as SA.Audit.AuditByFailOrPassOrSkip
		);

		return out;
	}
}
