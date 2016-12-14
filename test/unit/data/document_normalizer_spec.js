'use strict';

describe('data/documentNormalizer#normalize', function () {
  beforeEach(function () {
    module('cf.data');
    const normalize = this.$inject('data/documentNormalizer').normalize;
    this.otDoc = {setValueAt: sinon.stub(), getValueAt: sinon.stub()};
    this.snapshot = {};
    this.locales = [];
    this.normalize = function () {
      normalize(this.otDoc, this.snapshot, this.contentType, this.locales);
    };
  });

  it('removes unknown locales', function () {
    this.locales = [{internal_code: 'en'}];
    const fields = {
      A: { en: true, de: true },
      B: { en: true, es: true },
      C: { fr: true }
    };
    this.snapshot.fields = fields;
    this.normalize();
    expect(fields).toEqual({
      A: {en: true},
      B: {en: true},
      C: {}
    });
  });

  it('removes unknown fields', function () {
    const fields = {
      A: {},
      B: {},
      deleted: {}
    };
    this.snapshot.fields = fields;
    this.contentType = {
      data: {
        fields: [
          {id: 'A'},
          {id: 'B'}
        ]
      }
    };
    this.normalize();
    expect(fields).toEqual({
      A: {}, B: {}
    });
  });

  it('forces field value to be an object', function () {
    this.otDoc.getValueAt.returns(undefined);
    this.otDoc.getValueAt.withArgs(['fields']).returns('not an object');
    this.normalize();
    sinon.assert.calledWithExactly(this.otDoc.setValueAt, ['fields'], {});
  });

});
