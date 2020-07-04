import { Meta, Result, SkipResult } from "../types/audit";
import { Traces } from "../types/traces";

export default class Audit {
	static get meta(): Meta {
		return {} as Meta;
	}

	static audit(
		traces: Traces
	):
		| Promise<Result | SkipResult | undefined>
		| Result
		| SkipResult
		| undefined {
		return {} as Result | SkipResult;
	}
}
