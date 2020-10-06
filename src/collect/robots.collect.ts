import {PageContext} from '../types';
import {CollectorsIds} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';
import Collect from './collect';

export default class CollectRobots extends Collect {
	collectId: CollectorsIds = 'performancecollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<any> {}
}
