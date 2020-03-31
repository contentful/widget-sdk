import { cloneDeep, set } from 'lodash';
import jestKefir from 'jest-kefir';
import * as K from '../../../../../../test/utils/kefir';
import * as Kefir from 'utils/kefir';
import * as Permissions from 'access_control/EntityPermissions';

const kefirHelpers = jestKefir(Kefir);
const { value } = kefirHelpers;
expect.extend(kefirHelpers.extensions);

jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [{ internal_code: 'en-US' }, { internal_code: 'de' }],
}));

export const newEntry = (fields) => ({
  sys: {
    type: 'Entry',
    version: 1,
    contentType: {
      sys: { id: 'ctId' },
    },
  },
  fields: fields || {
    fieldA: { 'en-US': 'en' },
    fieldB: { 'en-US': 'val-EN', de: 'val-DE' },
    listField: { 'en-US': ['one'] },
    symbolField: { 'en-US': 'symbol value' },
    textField: { 'en-US': 'text value' },
  },
});

export const newContentType = (sys, fields) => ({
  data: {
    sys,
    fields: fields || [
      { id: 'fieldA' },
      { id: 'fieldB' },
      { id: 'unsetField' },
      { id: 'listField', type: 'Array', items: { type: 'Symbol' } },
      { id: 'symbolField', type: 'Symbol' },
      { id: 'textField', type: 'Text' },
    ],
  },
});

describe('empty test', () => {
  it('passes', () => {});
});

export default (createDocument) => {
  describe('Document', () => {
    const fieldPath = ['fields', 'fieldA', 'en-US'];
    const anotherFieldPath = ['fields', 'fieldB', 'en-US'];
    let doc;
    let entry;

    beforeEach(() => {
      entry = newEntry();
      doc = createDocument(entry).document;
    });

    // a stream of changes on the document (either remotely or locally)
    describe('changes', () => {
      it('is a Kefir.Stream', () => {
        expect(doc.changes).toBeStream();
      });

      describe('emits the changed value immediately after', () => {
        const fieldPath = ['fields', 'fieldA', 'en-US'];

        it('setValueAt(fieldPath) on a field', () => {
          expect(doc.changes).toEmit([value(fieldPath)], () => {
            doc.setValueAt(fieldPath, 'en-US-updated');
          });
        });

        it('pushValueAt(fieldPath) on a field', () => {
          const listFieldPath = ['fields', 'listField', 'en-US'];
          expect(doc.changes).toEmit([value(listFieldPath)], () => {
            doc.pushValueAt(listFieldPath, 'en-US-updated-2');
          });
        });

        it('removeValueAt(fieldPath) on a field', () => {
          expect(doc.changes).toEmit([value(fieldPath)], () => {
            doc.removeValueAt(fieldPath);
          });
        });
      });
    });

    describe('data$', () => {
      it('is a Kefir.Property', () => {
        expect(doc.data$).toBeProperty();
      });

      it('emits initial entity data', () => {
        K.assertCurrentValue(doc.data$, entry);
      });

      it('exposes updated entity data', () => {
        const updatedEntry = cloneDeep(entry);
        set(updatedEntry, fieldPath, 'en-US-updated');
        // Not testing "sys" version here, because it might be updated or not - depends on Document type being tested.
        doc.setValueAt(fieldPath, 'en-US-updated');
        expect(K.getValue(doc.data$).fields).toMatchObject(updatedEntry.fields);
      });
    });

    describe('state', () => {
      describe('error$', () => {
        it('is a Kefir.Property', () => {
          expect(doc.state.error$).toBeProperty();
        });
        it('is empty when opened document successfully', () => {
          K.assertCurrentValue(doc.state.error$, null);
        });
      });

      // Bool describing whether the document has changes unacknowledged by the server
      describe('isSaving$', () => {
        beforeEach(() => {
          doc = createDocument(entry).document;
        });

        it('is a Kefir.Property', () => {
          expect(doc.state.isSaving$).toBeProperty();
        });
        it('is false initially', () => {
          K.assertCurrentValue(doc.state.isSaving$, false);
        });
      });

      describe('isDirty$', () => {
        it('is a Kefir.Property', () => {
          expect(doc.state.isDirty$).toBeProperty();
        });
        it('is true for never-published document', () => {
          expect(doc.getValueAt(['sys', 'publishedVersion'])).toBeUndefined();
          K.assertCurrentValue(doc.state.isDirty$, true);
        });
        it('is false for a published document without changes', () => {
          doc.setValueAt(['sys', 'publishedVersion'], entry.sys.version);
          K.assertCurrentValue(doc.state.isDirty$, false);
        });
        it('is true for a published document with un-published changes', () => {
          doc.setValueAt(fieldPath, 'en-US-updated');
          K.assertCurrentValue(doc.state.isDirty$, true);
        });
        it('is false for a published document with published changes', () => {
          doc.setValueAt(fieldPath, 'en-US-updated');
          // Set published version to + 1 of current version, because setValueAt will bump the version again.
          doc.setValueAt(['sys', 'publishedVersion'], doc.getValueAt(['sys', 'version']) + 1);
          K.assertCurrentValue(doc.state.isDirty$, false);
        });
      });

      // NB: does not take field-based auth into account!
      describe('canEdit$', () => {
        it('is a Kefir.Property', () => {
          expect(doc.state.canEdit$).toBeProperty();
        });
        it('is true for non-archived, non-deleted document editable by the user', () => {
          const sys = doc.getValueAt(['sys']);
          expect(sys.archivedVersion).toBeUndefined();
          expect(sys.deletedVersion).toBeUndefined();
          expect(Permissions.create(entry.sys).can('update')).toBeTruthy();
          K.assertCurrentValue(doc.state.canEdit$, true);
        });
        it('is false for archived document', () => {
          doc.setValueAt(['sys', 'archivedVersion'], 1);
          K.assertCurrentValue(doc.state.canEdit$, false);
        });
        it('is false for deleted document', () => {
          doc.setValueAt(['sys', 'deletedVersion'], 1);
          K.assertCurrentValue(doc.state.canEdit$, false);
        });
        it('is false for document not editable by the user', () => {
          Permissions.returnValue.mockReturnValueOnce(false);
          doc = createDocument(entry).document; // recreate doc to use the updated permissions mock
          K.assertCurrentValue(doc.state.canEdit$, false);
        });
      });
    });

    describe('sysProperty', () => {
      it('is a Kefir.Property', () => {
        expect(doc.sysProperty).toBeProperty();
      });

      it('emits `entity.data.sys` as initial value', function () {
        K.assertCurrentValue(doc.sysProperty, entry.sys);
      });
    });

    describe('getValueAt(fieldPath)', () => {
      it('returns initial value', () => {
        expect(doc.getValueAt(['fields', 'fieldA', 'en-US'])).toBe('en');
      });

      it('returns the whole entity for [] path', () => {
        expect(doc.getValueAt([])).toMatchObject(entry);
      });

      it('returns updated value at changed field path', () => {
        doc.setValueAt(fieldPath, 'en-US-updated');
        expect(doc.getValueAt(fieldPath)).toBe('en-US-updated');
      });

      it('returns initial value at untouched field path', () => {
        doc.setValueAt(fieldPath, 'en-US-updated');
        expect(doc.getValueAt(anotherFieldPath)).toBe('val-EN');
      });
    });

    describe('getVersion()', () => {
      it('returns version of initial entity', () => {
        expect(doc.getVersion()).toBe(1);
      });
    });

    describe('setValueAt()', () => {
      it('sets value for a previously unset field', () => {
        doc.setValueAt(['fields', 'unsetField', 'en-US'], 'en-US-new-value');
        expect(doc.getValueAt(['fields', 'unsetField', 'en-US'])).toBe('en-US-new-value');
      });

      it('updates the existing field value', () => {
        doc.setValueAt(fieldPath, 'en-US-updated');
        expect(doc.getValueAt(fieldPath)).toBe('en-US-updated');
      });

      it('normalizes "" to `undefined` for a string type field', () => {
        doc.setValueAt(['fields', 'textField', 'en-US'], '');
        expect(doc.getValueAt(['fields', 'textField', 'en-US'])).toBeUndefined();
      });

      it('throws when `Symbol` type field is given non-string value', async () => {
        await expect(doc.setValueAt(['fields', 'symbolField', 'en-US'], 123)).rejects.toThrow(
          'Invalid string field value.'
        );
      });

      it('throws when `Text` type field is given non-string value', async () => {
        await expect(doc.setValueAt(['fields', 'textField', 'en-US'], 123)).rejects.toThrow(
          'Invalid string field value.'
        );
      });
    });

    describe('pushValueAt()', () => {
      it('adds an item to a list field', () => {
        const path = ['fields', 'listField', 'en-US'];
        const initialValue = doc.getValueAt(path);
        doc.pushValueAt(path, 'new-list-value');
        expect(doc.getValueAt(path)).toEqual([...initialValue, 'new-list-value']);
      });

      it('adds an item to an empty list field', () => {
        const path = ['fields', 'listField', 'en-US'];
        doc.removeValueAt(path);
        doc.pushValueAt(path, 'new-list-value');
        expect(doc.getValueAt(path)).toEqual(['new-list-value']);
      });

      it('silently fails on a non-list field', () => {
        const path = ['fields', 'symbolField', 'en-US'];
        const initialValue = doc.getValueAt(path);
        doc.pushValueAt(path, 'new-list-value');
        expect(doc.getValueAt(path)).toEqual(initialValue);
      });
    });

    describe('removeValueAt()', () => {
      it('removes a value from a field locale', () => {
        doc.removeValueAt(['fields', 'fieldB', 'en-US']);
        expect(doc.getValueAt(['fields', 'fieldB', 'en-US'])).toBeUndefined();
        expect(doc.getValueAt(['fields', 'fieldB', 'de'])).toBe('val-DE');
      });
      it('removes a whole field', () => {
        doc.removeValueAt(['fields', 'fieldA']);
        expect(doc.getValueAt(['fields', 'fieldA'])).toBeUndefined();
      });
      it('does not throw when removed a non-existing path', () => {
        expect(() => doc.removeValueAt(['fields', 'non-existing', 'field'])).not.toThrow();
      });
    });

    describe('snapshot normalization', () => {
      it('removes unknown fields and locales on document load', () => {
        const notNormalizedEntry = newEntry({
          field1: { 'en-US': true, fr: true },
          field2: { 'en-US': true, de: true },
          unknownField: true,
        });
        doc = createDocument(notNormalizedEntry, [
          { id: 'field1' },
          { id: 'field2', localised: false }, // disabled localization
        ]).document;

        const normalizedFieldValues = doc.getValueAt(['fields']);
        expect(normalizedFieldValues).toEqual({
          field1: { 'en-US': true },
          field2: { 'en-US': true, de: true }, // doc should keep even disabled locales
        });
      });
    });
  });
};
