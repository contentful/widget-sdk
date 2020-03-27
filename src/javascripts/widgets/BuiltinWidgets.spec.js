import { uniq } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets';

const CMA_ID_REGEXP = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,63}$/;
const BUILTIN_WIDGETS_COUNT = 25;

jest.mock('app/widgets/rich_text', () => {});
jest.mock('app/widgets/LinkEditor', () => ({ withCfWebApp: () => {} }));
jest.mock('ui/Framework/AngularComponent', () => () => null);

describe('BuiltinWidgets', () => {
  describe('#create()', () => {
    it(`returns a list of ${BUILTIN_WIDGETS_COUNT} built-in widgets`, () => {
      const list = createBuiltinWidgetList();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toHaveLength(BUILTIN_WIDGETS_COUNT);
    });

    it('returns a list of widget descriptors', () => {
      expect.assertions(BUILTIN_WIDGETS_COUNT * 2);
      createBuiltinWidgetList().forEach((descriptor) => {
        expect(descriptor).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          fieldTypes: expect.any(Array),
        });
        if (descriptor.template) {
          expect(descriptor.template).toEqual(expect.any(String));
        } else if (descriptor.buildTemplate) {
          expect(descriptor.buildTemplate).toEqual(expect.any(Function));
        } else if (descriptor.renderFieldEditor) {
          expect(descriptor.renderFieldEditor).toEqual(expect.any(Function));
        } else if (descriptor.renderWhen) {
          expect(descriptor.renderWhen).toEqual(expect.any(Function));
        } else {
          throw new Error('expect `template`, `buildTemplate` or `renderFieldEditor`');
        }
      });
    });

    // This asserts that developer who edits the list uses an ID
    // which will be accepted by the CMA (editor_interface).
    it('returns a valid CMA ID for each widget descriptor', () => {
      expect.assertions(BUILTIN_WIDGETS_COUNT);
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
