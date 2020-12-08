import { uniq } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets';
import { WidgetNamespace } from '@contentful/widget-renderer';

const CMA_ID_REGEXP = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,63}$/;
const widgetList = createBuiltinWidgetList();
const BUILTIN_WIDGETS_COUNT = widgetList.length;
const EDITOR_WIDGETS_COUNT = widgetList.filter(
  (widget) => widget.namespace == WidgetNamespace.EDITOR_BUILTIN
).length;

jest.mock('app/entity_editor/EntityField/EntityField', () => ({
  EntityField: () => null,
}));

describe('BuiltinWidgets', () => {
  describe('#create()', () => {
    it(`returns a list of ${BUILTIN_WIDGETS_COUNT} built-in widgets`, () => {
      const list = createBuiltinWidgetList();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toHaveLength(BUILTIN_WIDGETS_COUNT);
    });

    it('returns a list of widget descriptors', () => {
      expect.assertions(BUILTIN_WIDGETS_COUNT * 2 - EDITOR_WIDGETS_COUNT);
      createBuiltinWidgetList().forEach((descriptor) => {
        if (descriptor.namespace === WidgetNamespace.EDITOR_BUILTIN) {
          expect(descriptor).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            namespace: WidgetNamespace.EDITOR_BUILTIN,
          });
        } else {
          expect(descriptor).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            fieldTypes: expect.any(Array),
          });
          if (descriptor.renderFieldEditor) {
            expect(descriptor.renderFieldEditor).toEqual(expect.any(Function));
          } else {
            throw new Error('expect `renderFieldEditor`');
          }
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
