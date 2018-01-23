'use strict';

describe('Content Type List Controller', function () {
  let scope, cfStub, stubs, spaceContext;

  function makeCT (extensions) {
    const space = cfStub.space('spaceid');
    const ct = cfStub.contentType(space, 'typeid', 'typename');
    stubs = {};
    stubs.deleted = sinon.stub(ct, 'isDeleted');
    stubs.published = sinon.stub(ct, 'isPublished');
    stubs.hasUnpublishedChanges = sinon.stub(ct, 'hasUnpublishedChanges');
    stubs.publishedAt = sinon.stub(ct, 'getPublishedAt');
    ct.getName = sinon.stub().returns('CTNAME');
    return _.extend(ct, extensions);
  }

  beforeEach(function () {
    module('contentful/test');

    const $controller = this.$inject('$controller');
    const $rootScope = this.$inject('$rootScope');
    const getStore = this.$inject('TheStore').getStore;
    const store = getStore();

    cfStub = this.$inject('cfStub');
    spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.space.getContentTypes = sinon.stub().resolves([]);

    scope = $rootScope.$new();
    scope.context = {};
    scope.context.searchTerm = null;
    store.set = _.noop;
    $controller('ContentTypeListController', {$scope: scope});
    scope.$apply();
  });

  it('getting number of fields from a content type', function () {
    expect(scope.numFields(makeCT())).toEqual(0);
  });

  describe('on search term change', function () {
    it('if term is null list is not changed', function () {
      scope.context.searchTerm = null;
      scope.$apply();
      expect(scope.context.list).toBe('all');
    });

    describe('if term is set', function () {
      beforeEach(function () {
        scope.context.searchTerm = 'thing';
        scope.$apply();
      });

      it('list is not changed', function () {
        expect(scope.context.list).toBe('all');
      });

      it('content types are refreshed', function () {
        sinon.assert.called(spaceContext.space.getContentTypes);
      });
    });
  });

  describe('switching lists', function () {
    it('preserves search term', function () {
      scope.context.searchTerm = 'thing';
      scope.context.list = 'changed';
      this.$apply();
      expect(scope.context.searchTerm).toBe('thing');
    });

    it('refreshes content types', function () {
      scope.context.list = 'changed';
      this.$apply();
      sinon.assert.called(spaceContext.space.getContentTypes);
    });
  });

  describe('scope.visibleContentTypes', function () {
    it('only contains content types matched by the search', function () {
      const matched = makeCT({getName: sinon.stub().returns('MATCH')});
      const unmatched = makeCT({getName: sinon.stub().returns('MA')});
      spaceContext.space.getContentTypes.resolves([matched, unmatched]);

      scope.context.searchTerm = 'MA';
      this.$apply();
      expect(scope.visibleContentTypes.map((ct) => ct.getName())).toEqual(['MA', 'MATCH']);

      scope.context.searchTerm = 'MAT';
      this.$apply();
      expect(scope.visibleContentTypes.map((ct) => ct.getName())).toEqual(['MATCH']);
    });

    it('it does not include deleted content types', function () {
      spaceContext.contentTypes = [makeCT({
        getName: sinon.stub().returns('MATCH'),
        isDeleted: sinon.stub().returns(true)
      })];

      scope.context.searchTerm = 'MAT';
      this.$apply();
      expect(scope.visibleContentTypes.length).toBe(0);
    });
  });

  describe('query check', function () {
    it('has a query', function () {
      scope.context.searchTerm = 'term';
      expect(scope.hasQuery()).toBeTruthy();
    });

    it('has no query when term is null', function () {
      scope.context.searchTerm = null;
      expect(scope.hasQuery()).toBeFalsy();
    });

    it('has no query when term is empty string', function () {
      scope.context.searchTerm = '';
      expect(scope.hasQuery()).toBeFalsy();
    });
  });

  describe('status class', function () {
    it('is updated', function () {
      const contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusClass(contentType)).toBe('updated');
    });

    it('is published', function () {
      const contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusClass(contentType)).toBe('entity-status--published');
    });

    it('is draft', function () {
      const contentType = makeCT();
      stubs.publishedAt.returns(false);
      expect(scope.statusClass(contentType)).toBe('draft');
    });
  });

  describe('status label', function () {
    it('is updated', function () {
      const contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusLabel(contentType)).toBe('updated');
    });

    it('is active', function () {
      const contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusLabel(contentType)).toBe('active');
    });

    it('is draft', function () {
      const contentType = makeCT();
      stubs.publishedAt.returns(false);
      expect(scope.statusLabel(contentType)).toBe('draft');
    });
  });
});
