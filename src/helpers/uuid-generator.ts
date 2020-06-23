import {v1 as uuidv1} from 'uuid';

export function generate(): string {
	return uuidv1();
}
