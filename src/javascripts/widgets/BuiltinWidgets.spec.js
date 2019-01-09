import { uniq } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';

const CMA_ID_REGEXP = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,63}$/;

describe('BuiltinWidgets', () => {
  describe('#create()', () => {
    it('returns a list of widget descriptors', () => {
      createBuiltinWidgetList().forEach(descriptor => {
        expect(typeof descriptor.id).toBe('string');
        expect(typeof descriptor.name).toBe('string');
        expect(typeof descriptor.template).toBe('string');
        expect(Array.isArray(descriptor.fieldTypes)).toBe(true);
      });
    });

    // This asserts that developer who edits the list uses an ID
    // which will be accepted by the CMA (editor_interface).
    it('returns a valid CMA ID for each widget descriptor', () => {
      createBuiltinWidgetList().forEach(({ id }) => {
        expect(id).toMatch(CMA_ID_REGEXP);
      });
    });

    it('returns no widget descriptors with duplicate IDs', () => {
      const ids = createBuiltinWidgetList().map(({ id }) => id);
      const uniqueCount = uniq(ids).length;
      expect(ids).toHaveLength(uniqueCount);
    });
  });
});
