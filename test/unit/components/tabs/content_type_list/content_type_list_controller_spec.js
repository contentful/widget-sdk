'use strict';

describe('Content Type List Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    const $controller = this.$inject('$controller');
    const $rootScope = this.$inject('$rootScope');

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.endpoint = sinon.stub().resolves({items: []});

    this.scope = $rootScope.$new();
    this.scope.context = {searchTerm: null};

    $controller('ContentTypeListController', {$scope: this.scope});
    this.scope.$apply();
  });

  it('getting number of fields from a content type', function () {
    expect(this.scope.numFields({fields: []})).toEqual(0);
    expect(this.scope.numFields({fields: [{}]})).toEqual(1);
  });

  describe('on search term change', function () {
    it('if term is null list is not changed', function () {
      this.scope.context.searchTerm = null;
      this.scope.$apply();
      expect(this.scope.context.list).toBe('all');
    });

    describe('if term is set', function () {
      beforeEach(function () {
        this.scope.context.searchTerm = 'thing';
        this.scope.$apply();
      });

      it('list is not changed', function () {
        expect(this.scope.context.list).toBe('all');
      });

      it('content types are refreshed', function () {
        sinon.assert.called(this.spaceContext.endpoint);
      });
    });
  });

  describe('switching lists', function () {
    it('preserves search term', function () {
      this.scope.context.searchTerm = 'thing';
      this.scope.context.list = 'changed';
      this.$apply();
      expect(this.scope.context.searchTerm).toBe('thing');
    });

    it('refreshes content types', function () {
      this.scope.context.list = 'changed';
      this.$apply();
      sinon.assert.called(this.spaceContext.endpoint);
    });
  });

  describe('list of content types', function () {
    it('only contains content types matched by the search', function () {
      const matched = {name: 'MATCH'};
      const unmatched = {name: 'MA'};
      this.spaceContext.endpoint.resolves({items: [matched, unmatched]});

      this.scope.context.searchTerm = 'MA';
      this.$apply();
      expect(this.scope.visibleContentTypes.map(ct => ct.name)).toEqual(['MA', 'MATCH']);

      this.scope.context.searchTerm = 'MAT';
      this.$apply();
      expect(this.scope.visibleContentTypes.map(ct => ct.name)).toEqual(['MATCH']);
    });
  });

  describe('query check', function () {
    it('has a query', function () {
      this.scope.context.searchTerm = 'term';
      expect(this.scope.hasQuery()).toBeTruthy();
    });

    it('has no query when term is null', function () {
      this.scope.context.searchTerm = null;
      expect(this.scope.hasQuery()).toBeFalsy();
    });

    it('has no query when term is empty string', function () {
      this.scope.context.searchTerm = '';
      expect(this.scope.hasQuery()).toBeFalsy();
    });
  });

  describe('status class and label', function () {
    it('is updated', function () {
      const contentType = {sys: {publishedVersion: 1, version: 100}};
      expect(this.scope.statusClass(contentType)).toBe('updated');
      expect(this.scope.statusLabel(contentType)).toBe('updated');
    });

    it('is published', function () {
      const contentType = {sys: {publishedVersion: 1, version: 2}};
      expect(this.scope.statusClass(contentType)).toBe('entity-status--published');
      expect(this.scope.statusLabel(contentType)).toBe('active');
    });

    it('is draft', function () {
      const contentType = {sys: {}};
      expect(this.scope.statusClass(contentType)).toBe('draft');
      expect(this.scope.statusLabel(contentType)).toBe('draft');
    });
  });
});
