'use strict';

describe('Content Type List Controller', () => {
  beforeEach(function() {
    module('contentful/test');

    const $controller = this.$inject('$controller');
    const $rootScope = this.$inject('$rootScope');

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.endpoint = sinon.stub().resolves({ items: [] });

    this.scope = $rootScope.$new();
    this.scope.context = { searchTerm: null };

    $controller('ContentTypeListController', { $scope: this.scope });
    this.scope.$apply();
  });

  it('fetches content types', function() {
    sinon.assert.calledOnce(this.spaceContext.endpoint);
  });

  it('getting number of fields from a content type', function() {
    expect(this.scope.numFields({ fields: [] })).toEqual(0);
    expect(this.scope.numFields({ fields: [{}] })).toEqual(1);
  });

  describe('on search term change', () => {
    it('if term is null list is not changed', function() {
      this.scope.context.searchTerm = null;
      this.scope.$apply();
      expect(this.scope.context.list).toBe('all');
    });

    describe('if term is set', () => {
      beforeEach(function() {
        this.scope.context.searchTerm = 'thing';
        this.scope.$apply();
      });

      it('list is not changed', function() {
        expect(this.scope.context.list).toBe('all');
      });

      it('shows content types matched by the term', function() {
        this.scope.contentTypes = [{ name: 'MA' }, { name: 'MATCH' }];

        this.scope.context.searchTerm = 'MA';
        this.$apply();
        expect(this.scope.visibleContentTypes.map(ct => ct.name)).toEqual(['MA', 'MATCH']);

        this.scope.context.searchTerm = 'MAT';
        this.$apply();
        expect(this.scope.visibleContentTypes.map(ct => ct.name)).toEqual(['MATCH']);
      });
    });
  });

  describe('switching lists', () => {
    it('preserves search term', function() {
      this.scope.context.searchTerm = 'thing';
      this.scope.context.list = 'changed';
      this.$apply();
      expect(this.scope.context.searchTerm).toBe('thing');
    });

    it('filters content types', function() {
      this.scope.contentTypes = [
        {
          sys: {
            version: 10,
            publishedVersion: 2
          },
          name: 'updated'
        },
        {
          sys: {
            version: 1,
            publishedVersion: 1
          },
          name: 'not updated'
        }
      ];
      this.scope.context.list = 'changed';
      this.$apply();
      expect(this.scope.visibleContentTypes.map(ct => ct.name)).toEqual(['updated']);
    });
  });

  describe('status class and label', () => {
    it('is updated', function() {
      const contentType = { sys: { publishedVersion: 1, version: 100 } };
      expect(this.scope.statusType(contentType)).toBe('primary');
      expect(this.scope.statusLabel(contentType)).toBe('updated');
    });

    it('is published', function() {
      const contentType = { sys: { publishedVersion: 1, version: 2 } };
      expect(this.scope.statusType(contentType)).toBe('positive');
      expect(this.scope.statusLabel(contentType)).toBe('active');
    });

    it('is draft', function() {
      const contentType = { sys: {} };
      expect(this.scope.statusType(contentType)).toBe('warning');
      expect(this.scope.statusLabel(contentType)).toBe('draft');
    });
  });
});
