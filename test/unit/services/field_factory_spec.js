import sinon from 'npm:sinon';
import { map, uniq, find, filter, every } from 'lodash';

describe('field factory', () => {
  beforeEach(function () {
    module('contentful/test');
    this.fieldFactory = this.$inject('fieldFactory');
  });

  describe('type descriptor', () => {
    beforeEach(function () {
      this.types = this.fieldFactory.types;
    });

    it('is unique per type', () => {
      const types = map(this.types, 'name');
      const uniqueTypes = uniq(types);
      expect(types).toEqual(uniqueTypes);
    });

    it('has a label', () => {
      expect(every(this.types, 'label')).toBe(true);
    });

    it('has list label if there is a list variatn', () => {
      const listTypes = filter(this.types, 'hasListVariant');
      expect(every(listTypes, 'listLabel')).toBe(true);
    });
  });

  describe('#getLabel', () => {
    it('returns single value labels from name', function () {
      const fieldFactory = this.fieldFactory;
      fieldFactory.types.forEach(descriptor => {
        const field = fieldFactory.createTypeInfo(descriptor);
        const label = fieldFactory.getLabel(field);
        expect(label, descriptor.name);
      });
    });

    it('returns list labels from name', function () {
      const fieldFactory = this.fieldFactory;
      const listFieldDescriptors = filter(fieldFactory.all, { hasListVariant: true });
      listFieldDescriptors.forEach(descriptor => {
        const field = fieldFactory.createTypeInfo(descriptor, true);
        const label = fieldFactory.getLabel(field);
        expect(label, descriptor.name + ' List');
      });
    });
  });

  describe('#createTypeInfo', () => {
    it('creates entry link info', function () {
      const descriptor = find(this.fieldFactory.types, { name: 'Entry' });
      const typeInfo = this.fieldFactory.createTypeInfo(descriptor);
      expect(typeInfo).toEqual({
        type: 'Link',
        linkType: 'Entry'
      });
    });

    it('creates entry list link info', function () {
      const descriptor = find(this.fieldFactory.types, { name: 'Entry' });
      const typeInfo = this.fieldFactory.createTypeInfo(descriptor, true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Link',
          linkType: 'Entry'
        }
      });
    });

    it('creates symbol list info', function () {
      const descriptor = find(this.fieldFactory.types, { name: 'Symbol' });
      const typeInfo = this.fieldFactory.createTypeInfo(descriptor, true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Symbol'
        }
      });
    });
  });

  describe('#getTypeName()', () => {
    beforeEach(function () {
      this.getTypeName = this.fieldFactory.getTypeName;
    });

    itResolves(
      { type: 'Symbol' },
      'Symbol'
    );

    itResolves(
      { type: 'Array', items: { type: 'Symbol' } },
      'Symbols'
    );

    itResolves(
      { type: 'Link', linkType: 'Asset' },
      'Asset'
    );

    itResolves(
      { type: 'Array', items: { type: 'Link', linkType: 'Asset' } },
      'Assets'
    );

    function itResolves (type, name) {
      it('resolves "' + name + '"', function () {
        const name = this.getTypeName(type);
        expect(name).toEqual(name);
      });
    }
  });

  describe('#getLocaleCodes()', () => {
    it('returns default locale for non-localized field', function () {
      const LS = this.$inject('TheLocaleStore');
      LS.getDefaultLocale = sinon.stub().returns({ internal_code: 'DEF' });
      const codes = this.fieldFactory.getLocaleCodes({ localized: false });
      expect(codes).toEqual(['DEF']);
    });

    it('returns all private locales for localized field', function () {
      const LS = this.$inject('TheLocaleStore');
      LS.getPrivateLocales = sinon.stub().returns(
        [{ internal_code: 'A' }, { internal_code: 'B' }]);
      const codes = this.fieldFactory.getLocaleCodes({ localized: true });
      expect(codes).toEqual(['A', 'B']);
    });
  });
});
