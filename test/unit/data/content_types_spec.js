'use strict';

describe('data/ContentTypes', function () {

  beforeEach(function () {
    module('cf.data');
  });

  describe('#assureDisplayField', function () {
    var assureDisplayField;

    beforeEach(function () {
      assureDisplayField = this.$inject('data/ContentTypes').assureDisplayField;
    });

    it('does not change valid display field', function () {
      var ct = {
        displayField: 'ID',
        fields: [{
          id: 'ID',
          type: 'Symbol'
        }]
      };
      assureDisplayField(ct);
      expect(ct.displayField).toEqual('ID');
    });

    it('removes display field if field type cannot be displayed', function () {
      var ct = {
        displayField: 'ID',
        fields: [{
          id: 'ID',
          type: 'non displayable'
        }]
      };
      assureDisplayField(ct);
      expect(ct.displayField).toEqual(undefined);
    });

    it('removes display field if it points to missing field', function () {
      var ct = {
        displayField: 'ID',
        fields: [{
          id: 'ANOTHER ID',
          type: 'non displayable'
        }]
      };
      assureDisplayField(ct);
      expect(ct.displayField).toEqual(undefined);
    });

    it('changes invalid display field to first applicable field', function () {
      var ct = {
        displayField: 'ID',
        fields: [{
          id: 'FIRST ID',
          type: 'non displayable'
        }, {
          id: 'SECOND ID',
          type: 'Symbol'
        }, {
          id: 'THIRD ID',
          type: 'Symbol'
        }]
      };
      assureDisplayField(ct);
      expect(ct.displayField).toEqual('SECOND ID');
    });
  });
});
