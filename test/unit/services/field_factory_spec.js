'use strict';

describe('field factory', function () {
  beforeEach(module('contentful'));
  beforeEach(function () {
    this.fieldFactory = this.$inject('fieldFactory');
  });

  describe('descriptors', function () {

    it('has only one descriptor per type', function () {
      var types = _.map(this.fieldFactory.all, 'name');
      var uniqueTypes = _.uniq(types);
      expect(types).toEqual(uniqueTypes);
    });

  });

  describe('#getLabel', function () {

    it('returns single value labels from name', function () {
      var fieldFactory = this.fieldFactory;
      _.forEach(fieldFactory.types, function (descriptor) {
        var field = fieldFactory.createTypeInfo(descriptor);
        var label = fieldFactory.getLabel(field);
        expect(label, descriptor.name);
      });
    });

    it('returns list labels from name', function () {
      var fieldFactory = this.fieldFactory;
      var listFieldDescriptors = _.filter(fieldFactory.all, {hasListVariant: true});
      _.forEach(listFieldDescriptors, function (descriptor) {
        var field = fieldFactory.createTypeInfo(descriptor, true);
        var label = fieldFactory.getLabel(field);
        expect(label, descriptor.name + ' List');
      });
    });

  });

  describe('#createTypeInfo', function () {

    it('creates entry link info', function () {
      var descriptor = _.find(this.fieldFactory.types, {name: 'Entry'});
      var typeInfo = this.fieldFactory.createTypeInfo(descriptor);
      expect(typeInfo).toEqual({
        type: 'Link',
        linkType: 'Entry'
      });
    });

    it('creates entry list link info', function () {
      var descriptor = _.find(this.fieldFactory.types, {name: 'Entry'});
      var typeInfo = this.fieldFactory.createTypeInfo(descriptor, true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Link',
          linkType: 'Entry'
        }
      });
    });

    it('creates symbol list info', function () {
      var descriptor = _.find(this.fieldFactory.types, {name: 'Symbol'});
      var typeInfo = this.fieldFactory.createTypeInfo(descriptor, true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Symbol',
        }
      });
    });

  });
});
