import { createDocumentMock } from './Document/__mocks__/createDocumentMock';
import { createFieldLocaleDocument } from './fieldLocaleDocument';
import noop from 'lodash/noop';

const fieldsPath = ['FID', 'LC'];
const path = ['fields', ...fieldsPath];

let rootDoc;
const create = () => {
  const entity = {
    sys: {
      id: 'EID',
      type: 'Entry',
      version: 42,
    },
    fields: { FID: { LC: undefined } },
  };
  rootDoc = createDocumentMock().create(
    entity,
    {},
    noop,
    [{ id: 'FID' }, { id: 'FID-other' }],
    [{ internal_code: 'LC' }, { internal_code: 'LC-other' }]
  );
  jest.spyOn(rootDoc, 'getValueAt');
  jest.spyOn(rootDoc, 'setValueAt');
  jest.spyOn(rootDoc, 'removeValueAt');
  jest.spyOn(rootDoc, 'pushValueAt');
  jest.spyOn(rootDoc, 'insertValueAt');
  return createFieldLocaleDocument(rootDoc, { id: fieldsPath[0] }, fieldsPath[1], false);
};

describe('fieldLocaleDocument', () => {
  describe('delegates', () => {
    const testMethodDelegate = (method, target, args = [], withArrayValue) => {
      it(`delegates calls to ${method} ${withArrayValue ? 'with array value' : ''}`, () => {
        const doc = create();
        withArrayValue && doc.set(['A', 'B']);
        doc[method].apply(null, args);
        const targetArgs = [path].concat(args);
        expect(rootDoc[target]).toHaveBeenCalledWith(...targetArgs);
      });
    };

    testMethodDelegate('get', 'getValueAt');
    testMethodDelegate('set', 'setValueAt', ['VAL']);
    testMethodDelegate('remove', 'removeValueAt');
    testMethodDelegate('push', 'pushValueAt', ['VAL'], true);
    testMethodDelegate('insert', 'insertValueAt', [1, 'VAL'], true);
  });

  describe('#set() / #get()', () => {
    it('gets `undefined` initially', () => {
      const doc = create();
      expect(doc.get()).toBeUndefined();
    });

    it('gets value set in rootDoc', () => {
      const doc = create();
      rootDoc.setValueAt(path, 'VAL-123');
      expect(doc.get()).toEqual('VAL-123');
    });

    it('sets and gets', () => {
      const doc = create();
      doc.set('VAL-FOO');
      expect(doc.get()).toEqual('VAL-FOO');
    });
  });

  describe('#valueProperty()', () => {
    it('has initial value', () => {
      const doc = create();
      rootDoc.setValueAt(path, 'VAL');
      const changed = jest.fn();
      doc.valueProperty.onValue(changed);
      expect(changed).toHaveBeenCalledWith('VAL');
    });

    describe('change handling', () => {
      let changed;
      let doc;
      beforeEach(() => {
        doc = create();
        changed = jest.fn();
        doc.valueProperty.onValue(changed);
        changed.mockClear();
      });

      it('updates value when root doc changes at path', () => {
        rootDoc.setValueAt(path, 'VAL');
        expect(changed).toHaveBeenCalledWith('VAL');
      });

      it('updates value when root doc changes and reverts ', () => {
        const initialValue = doc.get();
        rootDoc.setValueAt(path, `${initialValue || ''}VAL`);
        rootDoc.setValueAt(path, initialValue);
        expect(changed).toHaveBeenCalledWith(initialValue);
      });

      it('does not update value when "set()" is called', () => {
        doc.set('VAL');
        rootDoc.setValueAt(path, 'VAL');
        expect(changed).not.toHaveBeenCalled();
      });
    });

    describe('#fieldChanges$', () => {
      it('emits when root document emits "localFieldChanges$" for current field', () => {
        const emitted = jest.fn();
        const doc = create();
        doc.localChanges$.onValue(emitted);
        rootDoc.setValueAt(['fields', 'FID', 'LC-other'], '');
        rootDoc.setValueAt(['fields', 'FID-other', 'LC'], '');
        expect(emitted).not.toHaveBeenCalled();
        rootDoc.setValueAt(['fields', ...fieldsPath]);
        expect(emitted).toHaveBeenCalledTimes(1);
      });
    });
  });
});
