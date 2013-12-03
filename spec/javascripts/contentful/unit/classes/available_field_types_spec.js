'use strict';

describe('Available field types', function () {
  var getFieldTypeName;
  beforeEach(function () {
    module('contentful/test');
    inject(function (_getFieldTypeName_) {
      getFieldTypeName = _getFieldTypeName_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('returns a field name for a simple field type', function () {
    expect(getFieldTypeName({type: 'Date'})).toEqual('Date/Time');
  });

  it('returns a field name for a collection field type', function () {
    expect(getFieldTypeName({type: 'Array', items: {type: 'Symbol'}})).toEqual('Symbols');
  });

  it('returns null for a non existing field type', function () {
    expect(getFieldTypeName({type: 'Unexistent'})).toBeUndefined();
  });

  it('returns null for a null type', function () {
    expect(getFieldTypeName(null)).toBeUndefined();
  });



});
