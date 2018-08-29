'use strict';

describe('helpers', () => {
  beforeEach(() => {
    module('contentful/test');
  });

  describe('#findWidget', () => {
    let findWidget;

    beforeEach(function() {
      findWidget = this.$inject('editingInterfaces/helpers').findWidget;
    });

    it('finds a widget for a field where the field has an apiName', () => {
      const widgetArr = [{ fieldId: 'foo' }, { fieldId: 'bar' }, { fieldId: 'someApiName' }];
      const field = { id: 'someId', apiName: 'someApiName' };
      const result = findWidget(widgetArr, field);
      const expected = { fieldId: 'someApiName' };
      expect(result).toEqual(expected);
    });

    it('finds a widget for a field where the field does not have an apiName', () => {
      const widgetArr = [{ fieldId: 'foo' }, { fieldId: 'bar' }, { fieldId: 'someId' }];
      const field = { id: 'someId' };
      const result = findWidget(widgetArr, field);
      const expected = { fieldId: 'someId' };
      expect(result).toEqual(expected);
    });

    it('returns undefined when a matching widget is not found', () => {
      const widgetArr = [{ fieldId: 'foo' }, { fieldId: 'bar' }, { fieldId: 'someId' }];
      const field = { id: 'abc' };
      const result = findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });

    it('returns undefined when a fieldId and apiName are undefined', () => {
      const widgetArr = [{ fieldId: undefined }];
      const field = { id: 'abc', apiName: undefined };
      const result = findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });
  });
});
