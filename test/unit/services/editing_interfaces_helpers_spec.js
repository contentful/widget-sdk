'use strict';

describe('helpers', function () {

  beforeEach(function () {
    module('contentful/test');
  });

  describe('#findField', function () {
    var findField;

    beforeEach(function () {
      findField = this.$inject('editingInterfaces/helpers').findField;
    });

    it('finds a field for a widget where the field has an apiName', function () {
      var fields = [
        {id: 'id1', apiName: 'apiName1'},
        {id: 'id2', apiName: 'apiName2'},
        {id: 'id3', apiName: 'apiName3'},
        {id: 'id4', apiName: 'apiName4'}
      ];
      var widget = {
        fieldId: 'apiName3'
      };
      var result = findField(fields, widget);
      var expected = {id: 'id3', apiName: 'apiName3'};
      expect(result).toEqual(expected);
    });

    it('finds a field for a widget where the field does not have an apiName', function () {
      var fields = [
        {id: 'id1', apiName: 'apiName1'},
        {id: 'fieldWithoutApiName'},
        {id: 'id3', apiName: 'apiName3'},
      ];
      var widget = {
        fieldId: 'fieldWithoutApiName'
      };
      var result = findField(fields, widget);
      var expected = {id: 'fieldWithoutApiName'};
      expect(result).toEqual(expected);
    });

    it('returns undefined when a matching field is not found', function () {
      var fields = [
        {id: 'id1', apiName: 'apiName1'},
        {id: 'fieldWithoutApiName'},
      ];
      var widget = {
        fieldId: 'missing'
      };
      var result = findField(fields, widget);
      expect(result).toBeUndefined();
    });

    it('returns undefined when a fieldId and apiNames are undefined', function () {
      var fields = [
        {id: 'id', apiName: undefined},
      ];
      var widget = {
        fieldId: undefined
      };
      var result = findField(fields, widget);
      expect(result).toBeUndefined();
    });
  });

  describe('#findWidget', function () {
    var findWidget;

    beforeEach(function () {
      findWidget = this.$inject('editingInterfaces/helpers').findWidget;
    });

    it('finds a widget for a field where the field has an apiName', function () {
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

    it('finds a widget for a field where the field does not have an apiName', function () {
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

    it('returns undefined when a matching widget is not found', function () {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someId'}
      ];
      var field = {id: 'abc'};
      var result = findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });

    it('returns undefined when a fieldId and apiName are undefined', function () {
      var widgetArr = [
        {fieldId: undefined},
      ];
      var field = {id: 'abc', apiName: undefined};
      var result = findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });
  });

});

