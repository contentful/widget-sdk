'use strict';

describe('data/ContentTypes', () => {

  beforeEach(() => {
    module('cf.data');
  });

  describe('#assureDisplayField', () => {
    beforeEach(function () {
      this.assureDisplayField = this.$inject('data/ContentTypes').assureDisplayField;
    });

    it('does not change valid display field', function () {
      var ct = {
        displayField: 'ID',
        fields: [{
          id: 'ID',
          type: 'Symbol'
        }]
      };
      this.assureDisplayField(ct);
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
      this.assureDisplayField(ct);
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
      this.assureDisplayField(ct);
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
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual('SECOND ID');
    });

    it('retains null as value if no applicable field was found', function () {
      var ct = {
        displayField: null,
        fields: [{
          id: 'fieldid',
          type: 'non-displayable'
        }]
      };
      this.assureDisplayField(ct);
      expect(ct.displayField).toEqual(null);
    });
  });

  describe('#assureName', () => {
    beforeEach(function () {
      this.assureName = this.$inject('data/ContentTypes').assureName;
    });

    it('sets missing name to "Untitled"', function () {
      var ct = {name: ''};
      this.assureName(ct);
      expect(ct.name).toEqual('Untitled');
    });

    it('retains existing name', function () {
      var ct = {name: 'NAME'};
      this.assureName(ct);
      expect(ct.name).toEqual('NAME');
    });
  });

  describe('#internalToPublic()', () => {
    beforeEach(function () {
      this.data = {
        name: 'apple',
        sys: {},
        displayField: 'yodasays',
        fields: [
          {
            apiName: 'eins',
            id: 'yodasays',
            name: 'wat'
          },
          {
            apiName: 'zwei',
            id: 'obiwansays',
            name: 'nein'
          },
          {
            id: 'lukesays',
            name: 'dad?'
          }
        ]
      };
      this.internalToPublic = this.$inject('data/ContentTypes').internalToPublic;
      this.ct = this.internalToPublic(this.data);
      this.assertPublicProp = (internalObj, prop) => {
        var publicData = this.internalToPublic(internalObj);
        expect(prop in publicData).toBe(true);
      };
    });

    it('sets "displayField" to apiName of referenced field', function () {
      var internalData = {
        displayField: 'internal',
        fields: [
          {id: 'internal', apiName: 'apiName'}
        ]
      };
      var publicData = this.internalToPublic(internalData);
      expect(publicData.displayField).toEqual('apiName');
    });

    it('has a description field', function () {
      this.assertPublicProp({}, 'description');
    });

    it('has a sys field', function () {
      this.assertPublicProp({}, 'sys');
    });

    it('has a name field', function () {
      this.assertPublicProp({}, 'name');
    });

    it('has a fields array', function () {
      this.assertPublicProp({}, 'fields');
      var publicData = this.internalToPublic({});
      expect(Array.isArray(publicData.fields)).toBe(true);
    });

    it('keeps internal "displayField" ID if apiName is not present', function () {
      var internalData = {
        displayField: 'internal',
        fields: [
          {id: 'internal'}
        ]
      };
      var publicData = this.internalToPublic(internalData);
      expect(publicData.displayField).toEqual('internal');
    });

    it('removes "apiName" property from all the fields', function () {
      this.ct.fields.forEach(field => {
        expect('apiName' in field).toEqual(false);
      });
    });

    it('uses "apiName" as id if available', function () {
      this.ct.fields.forEach((field, i) => {
        var originalField = this.data.fields[i];

        if ('apiName' in originalField) {
          expect(field.id).toEqual(originalField.apiName);
        } else {
          expect(field.id).toEqual(originalField.id);
        }
      });
    });
  });
});
