'use strict';

describe('cfSnapshotPresenter', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.removeDirectives('cfIframeWidget', 'cfWidgetRenderer', 'cfWidgetApi');
    });

    this.prepare = (value, field = {}, template = '<some-widget />') => {
      const data = {
        fieldLocale: { doc: { get: _.constant(value) } },
        widget: { field: field, template: template }
      };

      const el = this.$compile('<cf-snapshot-presenter />', data);

      return el.scope();
    };
  });

  describe('$scope.value', () => {
    it('gets value from the doc', function() {
      const scope = this.prepare('test');
      expect(scope.value).toBe('test');
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

  describe('$scope.isCustom', () => {
    it('is false for standard widget', function() {
      const scope = this.prepare();
      expect(scope.isCustom).toBe(false);
    });

    it('is true for custom widget', function() {
      const scope = this.prepare('test', {}, '<cf-iframe-widget />');
      expect(scope.isCustom).toBe(true);
    });
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
      'StructuredText'
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
