'use strict';

describe('data/ContentTypes', () => {
  beforeEach(() => {
    module('contentful/test');
  });

  describe('#assureDisplayField', () => {
    beforeEach(function() {
      this.assureDisplayField = this.$inject('data/ContentTypes').assureDisplayField;
    });

    it('does not change valid display field', function() {
      const ct = {
        displayField: 'ID',
        fields: [
          {
            id: 'ID',
            type: 'Symbol'
          }
        ]
      };
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual('ID');
    });

    it('removes display field if field type cannot be displayed', function() {
      const ct = {
        displayField: 'ID',
        fields: [
          {
            id: 'ID',
            type: 'non displayable'
          }
        ]
      };
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual(undefined);
    });

    it('removes display field if it points to missing field', function() {
      const ct = {
        displayField: 'ID',
        fields: [
          {
            id: 'ANOTHER ID',
            type: 'non displayable'
          }
        ]
      };
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual(undefined);
    });

    it('changes invalid display field to first applicable field', function() {
      const ct = {
        displayField: 'ID',
        fields: [
          {
            id: 'FIRST ID',
            type: 'non displayable'
          },
          {
            id: 'SECOND ID',
            type: 'Symbol'
          },
          {
            id: 'THIRD ID',
            type: 'Symbol'
          }
        ]
      };
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual('SECOND ID');
    });

    it('retains null as value if no applicable field was found', function() {
      const ct = {
        displayField: null,
        fields: [
          {
            id: 'fieldid',
            type: 'non-displayable'
          }
        ]
      };
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual(null);
    });
  });
});
