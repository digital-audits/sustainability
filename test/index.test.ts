import sustainability from '../src/sustainability/sustainability';

test('Sustainability is exported', () => {
	expect(sustainability).toBeDefined();
	expect(typeof sustainability.audit).toBe('function');
});
