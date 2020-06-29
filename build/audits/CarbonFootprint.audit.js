"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("./audit");
const references_1 = require("../references/references");
const settings_1 = require("../settings/settings");
const statistics_1 = require("../bin/statistics");
const utils_1 = require("../utils/utils");
const util = require("../utils/utils");
/**
 * @fileoverview Compute gCO2eq considering server location,
 *                  server greenness per individual resource.
 */
const MB_TO_BYTES = 1024 * 1024;
const GB_TO_MB = 1024;
const debug = util.debugGenerator('Carbonfootprint Audit');
class CarbonFootprintAudit extends audit_1.default {
    static get meta() {
        return {
            id: 'carbonfootprint',
            title: `Website’s carbon footprint is moderate`,
            failureTitle: `Website’s carbon footprint is high`,
            description: `The carbon footprint is the total amount of greenhouse gases released into the atmosphere to directly and indirectly support a particular activity. Keeping it as low as possible it’s key to prevent the climate change.`,
            category: 'server',
            collectors: ['transfercollect']
        };
    }
    static audit(traces) {
        return __awaiter(this, void 0, void 0, function* () {
            /* Const getGeoLocation = (ip:string) => {
            //2 letter ISO-3166-1 country code https://www.iban.com/country-codes
            const country = geoip.lookup(ip)?.country

            if(country){
                return country
            }

            return 'AVG'

            }

        const getGeoLocationMem = memoize(getGeoLocation)
        */
            debug('running');
            const getValidRecords = () => __awaiter(this, void 0, void 0, function* () {
                const getGreenRecord = () => __awaiter(this, void 0, void 0, function* () {
                    const pArray = traces.record.map((record) => __awaiter(this, void 0, void 0, function* () {
                        const isGreen = yield utils_1.isGreenServerMem(record.response.remoteAddress.ip);
                        return (isGreen === null || isGreen === void 0 ? void 0 : isGreen.green) || false;
                    }));
                    const isGreen = yield Promise.all(pArray);
                    return traces.record.map((record, index) => {
                        return {
                            id: record.request.requestId,
                            size: record.CDP.compressedSize.value,
                            unSize: record.response.uncompressedSize.value,
                            ip: record.response.remoteAddress.ip,
                            isGreen: isGreen[index]
                        };
                    });
                });
                return getGreenRecord();
                /* Return records.map(record=>{

                    //TODO: Bring the carbon data by regions first
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
            });
            debug('evaluating energy source');
            const records = yield getValidRecords();
            debug('evaluating total page weight');
            const totalTransfersize = statistics_1.sum(records.map(record => {
                return record.size;
            }));
            debug('evaluating file size by record type');
            const recordsByFileSize = traces.record.reduce((acc, record) => {
                acc[record.request.resourceType] = acc[record.request.resourceType] ?
                    acc[record.request.resourceType] += record.CDP.compressedSize.value : record.CDP.compressedSize.value;
                return acc;
            }, {});
            const recordsByFileSizePercentage = Object.keys(recordsByFileSize).map(key => {
                const value = ((recordsByFileSize[key] / totalTransfersize) *
                    100).toFixed(2);
                return {
                    [key]: value
                };
            });
            const totalWattage = records.map(record => {
                let size;
                if (record.size !== 0) {
                    size = record.size;
                }
                else {
                    size = record.unSize;
                }
                size /= MB_TO_BYTES * GB_TO_MB;
                if (record.isGreen) {
                    size *= references_1.variables.coreNetwork[0];
                }
                else {
                    size *= references_1.variables.dataCenter[0] + references_1.variables.coreNetwork[0];
                }
                return size;
            });
            // Apply references values
            debug('computing carbon footprint metric');
            const metric = statistics_1.sum(totalWattage) *
                references_1.variables.defaultCarbonIntensity[0] *
                references_1.variables.defaultDailyVisitors[0];
            const { median, p10 } = settings_1.DEFAULT.REPORT.scoring.CF;
            debug('computing log normal score');
            const score = util.computeLogNormalScore({ median, p10 }, metric) || 0;
            const meta = util.successOrFailureMeta(CarbonFootprintAudit.meta, score);
            debug('done');
            return {
                meta,
                score,
                scoreDisplayMode: 'numeric',
                extendedInfo: {
                    value: {
                        totalTransfersize: [totalTransfersize, 'bytes'],
                        totalWattage: [statistics_1.sum(totalWattage).toFixed(10), 'kWh'],
                        carbonfootprint: [metric.toFixed(5), 'gCO2eq / 100 views'],
                        share: recordsByFileSizePercentage
                    }
                }
            };
        });
    }
}
exports.default = CarbonFootprintAudit;
