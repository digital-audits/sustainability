import Audit from './audit';
import {variables} from '../references/references';
import {DEFAULT} from '../settings/settings';
import {sum} from '../bin/statistics';
import {isGreenServerMem} from '../utils/utils';
import * as util from '../utils/utils';
import {Meta, Result} from '../types/audit';
import {Traces} from '../types/traces';

const MB_TO_BYTES = 1024 * 1024;
const GB_TO_MB = 1024;

export default class CarbonFootprintAudit extends Audit {
	static get meta() {
		return {
			id: 'carbonfootprint',
			title: `Website’s carbon footprint is moderate`,
			failureTitle: `Website’s carbon footprint is high`,
			description: `The carbon footprint is the total amount of greenhouse gases released into the atmosphere for directly or indirectly supporting a particular activity. Keeping it as low as possible it’s key to prevent the climate change.`,
			category: 'server',
			collectors: ['transfercollect']
		} as Meta;
	}

	/**
	 * @workflow
	 * 	Compute gCO2eq considering server location,
	 *   server greenness per individual resource.
	 */
	static async audit(traces: Traces): Promise<Result | undefined> {
		/* const getGeoLocation = (ip:string) => {
            //2 letter ISO-3166-1 country code https://www.iban.com/country-codes
            const country = geoip.lookup(ip)?.country

            if(country){
                return country
            }

            return 'AVG'

            }

        const getGeoLocationMem = memoize(getGeoLocation)
        */
		const debug = util.debugGenerator('Carbonfootprint Audit');
		debug('running');
		const getValidRecords = async () => {
			const getGreenRecord = async () => {
				const pArray = traces.record.map(async record => {
					const isGreen = await isGreenServerMem(
						record.response.remoteAddress.ip
					);
					return isGreen?.green ?? false;
				});
				const isGreen = await Promise.all(pArray);
				return traces.record.map((record, index) => {
					return {
						id: record.request.requestId,
						size: record.CDP.compressedSize.value,
						unSize: record.response.uncompressedSize.value,
						ip: record.response.remoteAddress.ip,
						isGreen: isGreen[index]
					};
				});
			};

			return getGreenRecord();
			// TODO: Bring the carbon data by regions first
			/* Return records.map(record=>{

                    
                   /* if(record.isGreen === false){
                        const location = getGeoLocationMem(record.ip)

                        return {
                            ...record,
                            location
                        }
                    }

                    return record
                })
                */
		};

		debug('evaluating energy source');
		const records = await getValidRecords();
		debug('evaluating total page weight');
		const totalTransfersize = sum(
			records.map(record => {
				return record.size;
			})
		);
		debug('evaluating file size by record type');
		const recordsByFileSize = traces.record.reduce((acc, record) => {
			acc[record.request.resourceType] = acc[record.request.resourceType]
				? (acc[record.request.resourceType] += record.CDP.compressedSize.value)
				: record.CDP.compressedSize.value;

			return acc;
		}, {} as Record<string, number>);

		const recordsByFileSizePercentage = Object.keys(recordsByFileSize).map(
			key => {
				const value = (
					(recordsByFileSize[key] / totalTransfersize) *
					100
				).toFixed(2);

				return {
					[key]: value
				};
			}
		);
		const totalWattage = records.map(record => {
			let size;
			if (record.size !== 0) {
				size = record.size;
			} else {
				size = record.unSize;
			}

			size /= MB_TO_BYTES * GB_TO_MB;
			if (record.isGreen) {
				size *= variables.coreNetwork[0];
			} else {
				size *= variables.dataCenter[0] + variables.coreNetwork[0];
			}

			return size;
		});
		// Apply references values
		debug('computing carbon footprint metric');
		const metric =
			sum(totalWattage) *
			variables.defaultCarbonIntensity[0] *
			variables.defaultDailyVisitors[0];

		const {median, p10} = DEFAULT.REPORT.scoring.CF;
		debug('computing log normal score');
		const score = util.computeLogNormalScore({median, p10}, metric) || 0;
		const meta = util.successOrFailureMeta(CarbonFootprintAudit.meta, score);
		debug('done');
		return {
			meta,
			score,
			scoreDisplayMode: 'numeric',
			extendedInfo: {
				value: {
					totalTransfersize: [totalTransfersize, 'bytes'],
					totalWattage: [sum(totalWattage).toFixed(10), 'kWh'],
					carbonfootprint: [metric.toFixed(5), 'gCO2eq / 100 views'],
					share: recordsByFileSizePercentage
				}
			}
		};
	}
}
