import Audit from './audit';
/**
 * @description Find non-local fonts (i.e downloaded) and assert whether they are a subset.
 */
export default class UsesFontSubsettingAudit extends Audit {
    static get meta(): SA.Audit.Meta;
    /**
     * @applicable if uses nonLocalfonts (i.e fonts that are downloaded)
     *
     * @fileoverview The workflow is:
     * 1-Filter out local fonts (not downloaded)
     * 2-Find for each font if it is subsetted in :
     *      2.1 @font-face rules using unicode range propiety
     *
     *
     */
    static audit(traces: SA.Traces.Traces): SA.Audit.Result;
}
