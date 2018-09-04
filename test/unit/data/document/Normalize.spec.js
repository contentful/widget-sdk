import { normalize } from 'data/document/Normalize.es6';
import { get, set } from 'lodash';

describe('data/document/Normalize#normalize', () => {
  beforeEach(function() {
    module('contentful/test');
    this.otDoc = {
      setValueAt: (path, value) => {
        set(this.snapshot, path, value);
      },
      getValueAt: path => get(this.snapshot, path)
    };
    this.snapshot = {};
    this.locales = [];
    this.normalize = function() {
      normalize(this.otDoc, this.snapshot, this.contentType, this.locales);
    };
  });

  it('removes unknown locales', function() {
    this.locales = [{ internal_code: 'en' }];
    const fields = {
      A: { en: true, de: true },
      B: { en: true, es: true },
      C: { fr: true }
    };
    this.snapshot.fields = fields;
    this.normalize();
    expect(fields).toEqual({
      A: { en: true },
      B: { en: true },
      C: {}
    });
  });

  it('removes unknown fields', function() {
    const fields = {
      A: {},
      B: {},
      deleted: {}
    };
    this.snapshot.fields = fields;
    this.contentType = {
      data: {
        fields: [{ id: 'A' }, { id: 'B' }]
      }
    };
    this.normalize();
    expect(fields).toEqual({
      A: {},
      B: {}
    });
  });

  it('forces field value to be an object', function() {
    this.snapshot.fields = 'not an object';
    this.normalize();
    expect(this.snapshot.fields).toEqual({});
  });
});
