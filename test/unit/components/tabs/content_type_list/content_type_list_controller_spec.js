'use strict';

describe('Content Type List Controller', function () {
  var scope, cfStub, stubs, $q, spaceContext;

  function makeCT (extensions) {
    var space = cfStub.space('spaceid');
    var ct = cfStub.contentType(space, 'typeid', 'typename');
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

    var $controller = this.$inject('$controller');
    var $rootScope = this.$inject('$rootScope');
    var TheStore = this.$inject('TheStore');

    cfStub = this.$inject('cfStub');
    $q = this.$inject('$q');
    spaceContext = this.$inject('spaceContext');
    sinon.stub(spaceContext, 'refreshContentTypes').returns($q.resolve([]));

    scope = $rootScope.$new();
    scope.context = {};
    scope.searchTerm = null;
    TheStore.set = _.noop;
    $controller('ContentTypeListController', {$scope: scope});
    scope.$apply();
  });

  it('getting number of fields from a content type', function () {
    expect(scope.numFields(makeCT())).toEqual(0);
  });

  describe('empty content types', function () {
    it('content types are synced with spaceContext', function () {
      expect(scope.contentTypes).toEqual(spaceContext.getFilteredAndSortedContentTypes());
    });

    it('empty flag is true', function () {
      expect(scope.empty).toBe(true);
    });
  });

  describe('on search term change', function () {
    it('if term is null list is not changed', function () {
      scope.searchTerm = null;
      scope.$apply();
      expect(scope.context.list).toBe('all');
    });

    describe('if term is set', function () {
      beforeEach(function () {
        scope.searchTerm = 'thing';
        scope.$apply();
      });

      it('list is not changed', function () {
        expect(scope.context.list).toBe('all');
      });

      it('content types are refreshed', function () {
        sinon.assert.called(spaceContext.refreshContentTypes);
      });
    });
  });

  describe('switching lists', function () {
    it('preserves search term', function () {
      scope.searchTerm = 'thing';
      scope.context.list = 'changed';
      this.$apply();
      expect(scope.searchTerm).toBe('thing');
    });

    it('refreshes content types', function () {
      scope.context.list = 'changed';
      this.$apply();
      sinon.assert.called(spaceContext.refreshContentTypes);
    });
  });

  describe('scope.visibleContentTypes', function () {
    var contentTypes;
    beforeEach(function () {
      spaceContext.getFilteredAndSortedContentTypes = function () { return contentTypes; };
    });

    it('only contains content types matched by the search', function () {
      var matched = makeCT({getName: sinon.stub().returns('MATCH')});
      var unmatched = makeCT({getName: sinon.stub().returns('MA')});
      contentTypes = [matched, unmatched];

      scope.searchTerm = 'MA';
      this.$apply();
      expect(scope.visibleContentTypes).toEqual([matched, unmatched]);

      scope.searchTerm = 'MAT';
      this.$apply();
      expect(scope.visibleContentTypes).toEqual([matched]);
    });

    it('it does not include deleted content types', function () {
      contentTypes = [makeCT({
        getName: sinon.stub().returns('MATCH'),
        isDeleted: sinon.stub().returns(true)
      })];

      scope.searchTerm = 'MAT';
      this.$apply();
      expect(scope.visibleContentTypes.length).toBe(0);
    });
  });

  describe('query check', function () {
    it('has a query', function () {
      scope.searchTerm = 'term';
      expect(scope.hasQuery()).toBeTruthy();
    });

    it('has no query when term is null', function () {
      scope.searchTerm = null;
      expect(scope.hasQuery()).toBeFalsy();
    });

    it('has no query when term is empty string', function () {
      scope.searchTerm = '';
      expect(scope.hasQuery()).toBeFalsy();
    });
  });

  describe('status class', function () {
    it('is updated', function () {
      var contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusClass(contentType)).toBe('updated');
    });

    it('is published', function () {
      var contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusClass(contentType)).toBe('published');
    });

    it('is draft', function () {
      var contentType = makeCT();
      stubs.publishedAt.returns(false);
      expect(scope.statusClass(contentType)).toBe('draft');
    });
  });

  describe('status label', function () {
    it('is updated', function () {
      var contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusLabel(contentType)).toBe('updated');
    });

    it('is active', function () {
      var contentType = makeCT();
      stubs.publishedAt.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusLabel(contentType)).toBe('active');
    });

    it('is draft', function () {
      var contentType = makeCT();
      stubs.publishedAt.returns(false);
      expect(scope.statusLabel(contentType)).toBe('draft');
    });
  });
});
