import { Meta, Result } from "../types/audit";
import { RGBPowerFormat, Traces } from "../types/traces";
import Audit from "./audit";
import * as util from '../utils/utils'

const PIXEL_POWER_THRESHOLD = 20


export default class PixelEnergyEfficiencyAudit extends Audit {
	static get meta() {
		return {
			id: 'pixelefficiency',
			title: `Website is pixel energy efficient`,
			failureTitle: `Website is not pixel energy efficient`,
			description: `Displays are the dominant energy consuming component of battery-operated devices. Unlike liquid crystal display (LCD) panels which require high intensity backlight, the new emerging organic light emitting diode displays (OLED) emit light by their pixels themselves, which do not need an external backlight as the illumination source. Thus this brings us a new opportunity for energy saving, since energy consumption of each pixel of the OLED depends on the content displayed. `,
			category: 'design',
			collectors: ['transfercollect']
		} as Meta;
	}

	/**
	 * @workflow
	 * 	Get screenshot data and calculate the average RGB pixel ratio.
	 *   
	 */
	static async audit(traces: Traces): Promise<Result | undefined> {
		const debug = util.debugGenerator('PixelEnergyEfficiency Audit');
		debug('running');
		const pixelPower = traces.screenshot.power
		const score = Number(pixelPower <= PIXEL_POWER_THRESHOLD);
		const meta = util.successOrFailureMeta(PixelEnergyEfficiencyAudit.meta, score);
		debug('done');

			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				extendedInfo:{
					value:{
						power:[pixelPower.toFixed(2), 'W']
					}
				}
			};
	}
}
