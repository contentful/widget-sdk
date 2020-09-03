import { normalize } from './Normalize';
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

  it('removes empty fields', () => {
    locales = [{ internal_code: 'en' }, { internal_code: 'de' }];
    const link = { sys: { type: 'Link', linkType: 'Entry', id: 'id' } };
    const fields = {
      A: { en: true, de: undefined },
      B: {},
      C: { fr: true },
      D: { en: undefined },
      E: { en: [], de: [] },
      F: { en: [link], de: [] },
      G: { en: null }, // CMA keeps null for fields except multi-ref.
    };
    snapshot.fields = fields;
    runNormalize();
    expect(fields).toEqual({
      A: { en: true },
      F: { en: [link] },
      G: { en: null },
    });
  });
});
