import { getDeletedFields, normalize } from './Normalize';
import { get, set } from 'lodash';

describe('data/document/Normalize#normalize', () => {
  let snapshot;
  let otDoc;
  let locales;
  let runNormalize;

  beforeEach(() => {
    otDoc = {
      setValueAt: (path, value) => {
        set(snapshot, path, value);
      },
      getValueAt: (path) => get(snapshot, path),
    };
    snapshot = {};
    locales = [];
    runNormalize = (contentType = {}) => normalize(otDoc, snapshot, contentType, locales);
  });

  it('removes unknown locales', () => {
    locales = [{ internal_code: 'en' }];
    const fields = {
      A: { en: true, de: true },
      B: { en: true, es: true },
      C: { en: true, fr: true },
    };
    snapshot.fields = fields;
    runNormalize();
    expect(fields).toEqual({
      A: { en: true },
      B: { en: true },
      C: { en: true },
    });
  });

  it('removes unknown fields', () => {
    locales = [{ internal_code: 'en' }];
    const fields = {
      A: { en: true },
      B: { en: true },
      deleted: {},
    };
    snapshot.fields = fields;
    const contentType = {
      data: {
        fields: [{ id: 'A' }, { id: 'B' }],
      },
    };
    runNormalize(contentType);
    expect(fields).toEqual({
      A: { en: true },
      B: { en: true },
    });
  });

  it('forces field value to be an object', () => {
    snapshot.fields = 'not an object';
    runNormalize();
    expect(snapshot.fields).toEqual({});
  });

  describe('removeEmptyFields', () => {
    it('removes fields without values', () => {
      locales = [{ internal_code: 'en' }, { internal_code: 'de' }];
      const fields = {
        A: {},
      };
      snapshot.fields = fields;
      runNormalize();
      expect(fields).toEqual({});
    });

    it('removes undefined values', () => {
      locales = [{ internal_code: 'en' }, { internal_code: 'de' }];
      const fields = {
        A: { en: true, de: undefined },
        B: {},
        C: { en: undefined },
        D: { en: null }, // CMA keeps null for fields except multi-ref.
      };
      snapshot.fields = fields;
      runNormalize();
      expect(fields).toEqual({
        A: { en: true },
        D: { en: null },
      });
    });

    it('removes empty arrays for array fields', () => {
      locales = [{ internal_code: 'en' }, { internal_code: 'de' }];
      const link = { sys: { type: 'Link', linkType: 'Entry', id: 'id' } };
      const fields = {
        A: { en: [], de: [] },
        B: { en: [link], de: [] },
      };
      snapshot.fields = fields;
      const contentType = {
        data: {
          fields: [
            { id: 'A', type: 'Array' },
            { id: 'B', type: 'Array' },
          ],
        },
      };
      runNormalize(contentType);
      expect(fields).toEqual({
        B: { en: [link] },
      });
    });

    it('does not remove empty arrays for non-array (e.g. JSON) fields', () => {
      locales = [{ internal_code: 'en' }];
      const fields = {
        A: { en: [] },
      };
      snapshot.fields = fields;
      const contentType = {
        data: {
          fields: [{ id: 'A', type: 'Object' }],
        },
      };
      runNormalize(contentType);
      expect(fields).toEqual({
        A: { en: [] },
      });
    });
  });

  describe('getDeletedFields', () => {
    it('returns entry fields not listed in the content type', () => {
      locales = [{ internal_code: 'en' }];
      snapshot.fields = {
        A: { en: true },
        B: { en: true },
        C: { en: true },
        deleted: {},
      };
      const contentType = {
        data: {
          fields: [{ id: 'A' }, { id: 'B' }],
        },
      };
      expect(getDeletedFields(snapshot, contentType)).toEqual(['C', 'deleted']);
    });
  });
});
