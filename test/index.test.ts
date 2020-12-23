import { Sustainability } from '../src';

test('Sustainability is exported', () => {
	expect(Sustainability).toBeDefined();
	expect(typeof Sustainability.audit).toBe('function');
});


