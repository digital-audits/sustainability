"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * World average intensity from Electricity Map
 * It represents the greenhouse gas footprint of 1 kWh consumed inside a given country.
 * The footprint is measured in gCO2eq (grams CO2 equivalent), meaning each greenhouse
 * gas is converted to its CO2 equivalent in terms of global warming potential over 100 year
 * (for instance, 1 gram of methane emitted has the same global warming impact during 100 years
 *  as ~34 grams of CO2 over the same period).
 * @see https://github.com/tmrowco/electricitymap-contrib/blob/master/config/co2eq_parameters.json
 */
exports.defaultCarbonIntensity = [
    301.13684338512996,
    'gCO2eq/kWh'
];
/**
 * Energy intensity of web data
 * @see https://onlinelibrary.wiley.com/doi/full/10.1111/jiec.12630
 */
exports.variables = {
    dataCenter: [0.06, 'kWh/GB'],
    coreNetwork: [0.052, 'kWh/GB'],
    defaultDailyVisitors: [100, 'visits/day'],
    defaultCarbonIntensity: exports.defaultCarbonIntensity
};
