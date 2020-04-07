import { valuePropertyAt, localFieldChanges } from '../documentHelpers';
import { createCmaDoc } from '../index';
import * as K from '../../../../../../test/utils/kefir';

const ENTRY = {
  data: {
    sys: {
      type: 'Entry',
      version: 1,
      contentType: {
        sys: { id: 'ctId' }
      }
    },
    fields: {
      fieldA: { 'en-US': 'en' },
      fieldB: { 'en-US': 'val-EN', de: 'val-DE' },
      unknownField: {}
    }
  },
  setDeleted: () => {}
};

jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [{ internal_code: 'en-US' }]
}));

describe('entity_editor/Document helpers', () => {
  /**
   * @type {Document}
   */
  let doc;
  beforeEach(() => {
    doc = createCmaDoc(ENTRY, { sys: {}, fields: [{ id: 'fieldA' }, { id: 'fieldB' }] }, () => {});
  });

  describe('valuePropertyAt', () => {
    it('returns a K.Property with the whole unwrapped entity for an empty path', () => {
      K.assertCurrentValue(valuePropertyAt(doc, []), ENTRY['data']);
    });

    it('returns a K.Property with initial value', () => {
      K.assertCurrentValue(valuePropertyAt(doc, ['fields', 'fieldA', 'en-US']), 'en');
    });

    it('returns an updated value when a document is changed', async () => {
      const property = valuePropertyAt(doc, ['fields', 'fieldA', 'en-US']);
      await doc.setValueAt(['fields', 'fieldA', 'en-US'], 'new value');
      K.assertCurrentValue(property, 'new value');
    });
  });

  describe('localFieldChanges', () => {
    let onValue;
    beforeEach(() => {
      onValue = jest.fn();
      localFieldChanges(doc).onValue(onValue);
    });

    it('emits local field change for fields', async () => {
      await doc.setValueAt(['fields', 'A', 'B'], true);
      expect(onValue).toBeCalledTimes(1);
      expect(onValue).toBeCalledWith(['A', 'B']);

      await doc.removeValueAt(['fields']);
      await doc.setValueAt(['fields', 'A', 'B', 'C'], true);
      expect(onValue).toBeCalledTimes(2);
      expect(onValue).toBeCalledWith(['A', 'B']);
    });

    it('does not emit local field change for other paths', async () => {
      await doc.setValueAt(['fields', 'A'], true);
      await doc.removeValueAt(['fields']);
      await doc.setValueAt(['fields'], true);
      await doc.setValueAt(['other'], true);

      expect(onValue).not.toBeCalled();
    });
  });
});
