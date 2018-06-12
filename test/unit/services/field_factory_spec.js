'use strict';

describe('field factory', () => {
  beforeEach(function () {
    module('contentful/test');
    this.fieldFactory = this.$inject('fieldFactory');
  });

  describe('type descriptor', () => {
    var types;

    beforeEach(function () {
      types = this.fieldFactory.types;
    });

    it('is unique per type', () => {
      var types = _.map(types, 'name');
      var uniqueTypes = _.uniq(types);
      expect(types).toEqual(uniqueTypes);
    });

    it('has a label', () => {
      expect(_.every(types, 'label')).toBe(true);
    });

    it('has list label if there is a list variatn', () => {
      var listTypes = _.filter(types, 'hasListVariant');
      expect(_.every(listTypes, 'listLabel')).toBe(true);
    });

  });

  describe('#getLabel', () => {

    it('returns single value labels from name', function () {
      var fieldFactory = this.fieldFactory;
      _.forEach(fieldFactory.types, descriptor => {
        var field = fieldFactory.createTypeInfo(descriptor);
        var label = fieldFactory.getLabel(field);
        expect(label, descriptor.name);
      });
    });

    it('returns list labels from name', function () {
      var fieldFactory = this.fieldFactory;
      var listFieldDescriptors = _.filter(fieldFactory.all, {hasListVariant: true});
      _.forEach(listFieldDescriptors, descriptor => {
        var field = fieldFactory.createTypeInfo(descriptor, true);
        var label = fieldFactory.getLabel(field);
        expect(label, descriptor.name + ' List');
      });
    });

  });

  describe('#createTypeInfo', () => {

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

  describe('#getTypeName()', () => {
    beforeEach(function () {
      this.getTypeName = this.fieldFactory.getTypeName;
    });

    itResolves(
      {type: 'Symbol'},
      'Symbol'
    );

    itResolves(
      {type: 'Array', items: {type: 'Symbol'}},
      'Symbols'
    );

    itResolves(
      {type: 'Link', linkType: 'Asset'},
      'Asset'
    );

    itResolves(
      {type: 'Array', items: {type: 'Link', linkType: 'Asset'}},
      'Assets'
    );

    function itResolves(type, name) {
      it('resolves "' + name + '"', function () {
        var name = this.getTypeName(type);
        expect(name).toEqual(name);
      });
    }
  });

  describe('#getLocaleCodes()', () => {
    it('returns default locale for non-localized field', function () {
      var LS = this.$inject('TheLocaleStore');
      LS.getDefaultLocale = sinon.stub().returns({internal_code: 'DEF'});
      var codes = this.fieldFactory.getLocaleCodes({localized: false});
      expect(codes).toEqual(['DEF']);
    });

    it('returns all private locales for localized field', function () {
      var LS = this.$inject('TheLocaleStore');
      LS.getPrivateLocales = sinon.stub().returns([{internal_code: 'A'}, {internal_code: 'B'}]);
      var codes = this.fieldFactory.getLocaleCodes({localized: true});
      expect(codes).toEqual(['A', 'B']);
    });
  });
});
