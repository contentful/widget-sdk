'use strict';

describe('field factory', function () {
  beforeEach(module('contentful'));
  beforeEach(function () {
    this.fieldFactory = this.$inject('fieldFactory');
  });

  describe('descriptors', function () {

    it('has only one descriptor per type', function () {
      var types = _.map(this.fieldFactory.all, 'type');
      var uniqueTypes = _.uniq(types);
      expect(types).toEqual(uniqueTypes);
    });

  });

  describe('#getLabel', function () {

    it('returns single value labels from name', function () {
      var fieldFactory = this.fieldFactory;
      _.forEach(fieldFactory.all, function (descriptor) {
        var field = fieldFactory.createTypeInfo(descriptor.type);
        var label = fieldFactory.getLabel(field);
        expect(label, descriptor.name);
      });
    });

    it('returns list labels from name', function () {
      var fieldFactory = this.fieldFactory;
      var listFieldDescriptors = _.filter(fieldFactory.all, {hasListVariant: true});
      _.forEach(listFieldDescriptors, function (descriptor) {
        var field = fieldFactory.createTypeInfo(descriptor.type);
        var label = fieldFactory.getLabel(field);
        expect(label, descriptor.name + ' List');
      });
    });

  });

  describe('#createTypeInfo', function () {

    it('creates entry link info', function () {
      var typeInfo = this.fieldFactory.createTypeInfo('Entry');
      expect(typeInfo).toEqual({
        type: 'Link',
        linkType: 'Entry'
      });
    });

    it('creates entry list link info', function () {
      var typeInfo = this.fieldFactory.createTypeInfo('Entry', true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Link',
          linkType: 'Entry'
        }
      });
    });

    it('creates symbol list info', function () {
      var typeInfo = this.fieldFactory.createTypeInfo('Symbol', true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Symbol',
        }
      });
    });

  });
});
