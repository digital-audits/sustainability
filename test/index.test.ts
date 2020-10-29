import {Sustainability} from '../src';
import commander from '../src/commander/commander';

test('Sustainability is exported', () => {
	expect(Sustainability).toBeDefined();
	expect(typeof Sustainability.audit).toBe('function');
});


