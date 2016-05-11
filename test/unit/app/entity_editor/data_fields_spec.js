'use strict';

describe('EntityEditor/DataFields', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });
  });

  describe('#create()', function () {
    beforeEach(function () {
      var ctFields = [
        {
          apiName: 'A',
          id: 'FIELD_A'
        }, {
          apiName: 'B',
          id: 'FIELD_B'
        }
      ];

      var createDataFields = this.$inject('EntityEditor/DataFields').create;

      var localeStore = this.$inject('TheLocaleStore');
      localeStore.setLocales([
        {code: 'en', internal_code: 'en-internal'},
        {code: 'hi', internal_code: 'hi-internal'}
      ]);

      this.entity = {
        data: {
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
        }
      };

      var scope = {
        $on: sinon.stub(),
        entity: this.entity
      };

      var OtDoc = this.$inject('mocks/OtDoc');
      this.emitOtChange = function (path, value) {
        var snapshot = {};
        dotty.put(snapshot, path, value);
        var doc = new OtDoc(snapshot);
        var ops = [{p: path}];
        scope.$on.withArgs('otChange').yield(null, doc, ops);
      };

      this.fieldsApi = createDataFields(ctFields, scope);
    });

    describe('#getValue()', function () {
      it('returns value of field for the default locale', function () {
        var fieldData = this.entity.data.fields;
        expect(this.fieldsApi.A.getValue())
        .toEqual(fieldData.FIELD_A['en-internal']);
        expect(this.fieldsApi.B.getValue())
        .toEqual(fieldData.FIELD_B['en-internal']);
      });

      it('returns value of field if fo a given locale', function () {
        var fieldData = this.entity.data.fields;
        expect(this.fieldsApi.A.getValue('hi'))
        .toEqual(fieldData.FIELD_A['hi-internal']);
        expect(this.fieldsApi.B.getValue('hi'))
        .toEqual(fieldData.FIELD_B['hi-internal']);
      });

      it('throws if locale isn’t in list of active locales', function () {
        var field = this.fieldsApi.A;
        expect(function () {
          field.getValue('invalidLocale');
        }).toThrowError('Unknown locale "invalidLocale"');
      });
    });

    describe('#onValueChanged()', function () {
      it('triggers update for when base signal dispatches', function () {
        var cb = sinon.spy();
        this.fieldsApi.A.onValueChanged('hi', cb);
        this.emitOtChange(['fields', 'FIELD_A', 'hi-internal'], 'omg');
        this.emitOtChange(['fields', 'FIELD_A', 'other'], 'omg');
        this.emitOtChange(['fields', 'FIELD_B', 'hi-internal'], 'omg');
        sinon.assert.calledWithExactly(cb, 'omg');
        sinon.assert.calledOnce(cb);
      });

      it('uses default locale if locale isn’t specified', function () {
        var cb = sinon.spy();
        this.fieldsApi.A.onValueChanged(cb);
        this.emitOtChange(['fields', 'FIELD_A', 'en-internal'], 'omg');
        sinon.assert.calledOnce(cb);
        sinon.assert.calledWithExactly(cb, 'omg');
      });

      it('throws if locale is invalid', function () {
        var field = this.fieldsApi.A;
        expect(function () {
          field.onValueChanged('invalidLocale', sinon.spy());
        }).toThrowError('Unknown locale "invalidLocale"');
      });

      it('does not invoke the callback once it is detached', function () {
        var cb = sinon.spy();
        var detach = this.fieldsApi.A.onValueChanged(cb);

        this.emit = function () {
          this.emitOtChange(['fields', 'FIELD_A', 'en-internal'], 'omg');
        };

        this.emit();
        sinon.assert.calledWithExactly(cb, 'omg');

        detach();
        this.emit();
        sinon.assert.calledOnce(cb);
      });
    });
  });
});
