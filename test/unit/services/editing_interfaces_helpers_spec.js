'use strict';

describe('helpers', () => {

  beforeEach(() => {
    module('contentful/test');
  });

  describe('#findWidget', () => {
    var findWidget;

    beforeEach(function () {
      findWidget = this.$inject('editingInterfaces/helpers').findWidget;
    });

    it('finds a widget for a field where the field has an apiName', () => {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someApiName'}
      ];
      var field = {id: 'someId', apiName: 'someApiName'};
      var result = findWidget(widgetArr, field);
      var expected = {fieldId: 'someApiName'};
      expect(result).toEqual(expected);
    });

    it('finds a widget for a field where the field does not have an apiName', () => {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someId'}
      ];
      var field = {id: 'someId'};
      var result = findWidget(widgetArr, field);
      var expected = {fieldId: 'someId'};
      expect(result).toEqual(expected);
    });

    it('returns undefined when a matching widget is not found', () => {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someId'}
      ];
      var field = {id: 'abc'};
      var result = findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });

    it('returns undefined when a fieldId and apiName are undefined', () => {
      var widgetArr = [
        {fieldId: undefined},
      ];
      var field = {id: 'abc', apiName: undefined};
      var result = findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });
  });

});

