'use strict';
import {create as createDocument} from 'helpers/mocks/entity_editor_document';

describe('EntityEditor/DataFields', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });
  });

  describe('#create()', function () {
    beforeEach(function () {
      const ctFields = [
        {
          apiName: 'A',
          id: 'FIELD_A'
        }, {
          apiName: 'B',
          id: 'FIELD_B'
        }
      ];

      const createDataFields = this.$inject('EntityEditor/DataFields').create;

      const localeStore = this.$inject('TheLocaleStore');
      localeStore.setLocales([
        {code: 'en', internal_code: 'en-internal', default: true},
        {code: 'hi', internal_code: 'hi-internal'}
      ]);

      this.otDoc = createDocument({
        sys: {
          type: 'Entry'
        },
        fields: {
          FIELD_A: {
            'en-internal': 'A-EN',
            'hi-internal': 'A-HI'
          },
          FIELD_B: {
            'en-internal': 'B-EN',
            'hi-internal': 'B-HI'
          }
        }
      });

      this.fieldsApi = createDataFields(ctFields, this.otDoc);
    });

    describe('#getValue()', function () {
      it('returns value of field for the default locale', function () {
        const fieldData = this.otDoc.getValueAt(['fields']);
        expect(this.fieldsApi.A.getValue())
        .toEqual(fieldData.FIELD_A['en-internal']);
        expect(this.fieldsApi.B.getValue())
        .toEqual(fieldData.FIELD_B['en-internal']);
      });

      it('returns value of field if fo a given locale', function () {
        const fieldData = this.otDoc.getValueAt(['fields']);
        expect(this.fieldsApi.A.getValue('hi'))
        .toEqual(fieldData.FIELD_A['hi-internal']);
        expect(this.fieldsApi.B.getValue('hi'))
        .toEqual(fieldData.FIELD_B['hi-internal']);
      });

      it('throws if locale isn’t in list of active locales', function () {
        const field = this.fieldsApi.A;
        expect(function () {
          field.getValue('invalidLocale');
        }).toThrowError('Unknown locale "invalidLocale"');
      });
    });

    describe('#onValueChanged()', function () {
      it('call callback when value at locale changes', function () {
        const cb = sinon.spy();
        this.fieldsApi.A.onValueChanged('hi', cb);
        cb.reset();
        this.otDoc.setValueAt(['fields', 'FIELD_A', 'hi-internal'], 'omg');
        this.$apply();
        sinon.assert.calledOnce(cb);
        sinon.assert.calledWithExactly(cb, 'omg');
      });

      it('call callback when value at default locale changes', function () {
        const cb = sinon.spy();
        this.fieldsApi.A.onValueChanged(cb);
        cb.reset();
        this.otDoc.setValueAt(['fields', 'FIELD_A', 'en-internal'], 'omg');
        this.$apply();
        sinon.assert.calledOnce(cb);
        sinon.assert.calledWithExactly(cb, 'omg');
      });

      it('throws if locale is invalid', function () {
        const field = this.fieldsApi.A;
        expect(function () {
          field.onValueChanged('invalidLocale', sinon.spy());
        }).toThrowError('Unknown locale "invalidLocale"');
      });
    });
  });
});
