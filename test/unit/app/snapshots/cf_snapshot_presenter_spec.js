import _ from 'lodash';

describe('cfSnapshotPresenter', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.constant('cfIframeWidgetDirective', () => {});
      $provide.constant('cfWidgetRendererDirective', () => {});
      $provide.constant('cfWidgetApiDirective', () => {});
    });

    this.prepare = (value, field = {}, version = 'current') => {
      const data = {
        widget: { field: { ...field, id: 'FID-internal' } },
        locale: { internal_code: 'DE-internal' },
        entry: { data: { fields: { 'FID-internal': { 'DE-internal': value } } } },
        snapshot: { snapshot: { fields: { 'FID-internal': { 'DE-internal': 'SNAPSHOT VALUE' } } } },
        version
      };

      const el = this.$compile('<cf-snapshot-presenter />', data);

      return el.scope();
    };
  });

  describe('$scope.value', () => {
    it('gets value from the entry', function() {
      const scope = this.prepare('test');
      expect(scope.value).toBe('test');
    });

    it('gets value from the snapshot', function() {
      const scope = this.prepare('test', {}, 'snapshot');
      expect(scope.value).toBe('SNAPSHOT VALUE');
    });
  });

  describe('$scope.hasValue', () => {
    [
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
      ['empty array', []],
      ['empty object', {}]
    ].forEach(test(false));

    [
      ['non-empty string', 'test'],
      ['number', 123],
      ['boolean', false],
      ['non-empty object', { some: 'prop' }],
      ['non-empty array', [1, 2, 3]]
    ].forEach(test(true));

    function test(expected) {
      return ([type, value]) => {
        it(`is ${expected} for ${type}`, function() {
          const scope = this.prepare(value);
          expect(scope.value).toBe(value);
          expect(scope.hasValue).toBe(expected);
        });
      };
    }
  });

  describe('$scope.type', () => {
    [
      'Boolean',
      'Text',
      'Symbol',
      'Object',
      'Integer',
      'Number',
      'Date',
      'Location',
      'RichText'
    ].forEach(type => {
      it(`recognizes ${type} type`, function() {
        const scope = this.prepare(null, { type: type });
        expect(scope.type).toBe(type);
      });
    });

    it('recognizes array of symbols', function() {
      const scope = this.prepare(null, { type: 'Array', items: { type: 'Symbol' } });
      expect(scope.type).toBe('Array<Symbol>');
    });

    it('recognizes all types of links (single, multiple', function() {
      const scope1 = this.prepare(null, { type: 'Link' });
      const scope2 = this.prepare(null, { type: 'Array', items: { type: 'Link' } });
      expect(scope1.type).toBe('Reference');
      expect(scope2.type).toBe('Reference');
    });
  });

  describe('$scope.linkType', () => {
    it('is undefined if field is not link or array of links', function() {
      const scope = this.prepare();
      expect(scope.linkType).toBeUndefined();
    });

    it('is type of single link', function() {
      const scope = this.prepare(null, { type: 'Link', linkType: 'Entry' });
      expect(scope.linkType).toBe('Entry');
    });

    it('is type of items of array of links', function() {
      const scope = this.prepare(null, { type: 'Array', items: { linkType: 'Asset' } });
      expect(scope.linkType).toBe('Asset');
    });
  });
});
