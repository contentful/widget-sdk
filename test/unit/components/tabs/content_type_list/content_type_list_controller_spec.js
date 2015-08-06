'use strict';

describe('Content Type List Controller', function () {
  var controller, scope, stubs;

  function makeCT (extensions) {
    var ct;
    inject(function (cfStub) {
      var space = cfStub.space('spaceid');
      ct = cfStub.contentType(space, 'typeid', 'typename');
    });
    stubs.deleted = sinon.stub(ct, 'isDeleted');
    stubs.published = sinon.stub(ct, 'isPublished');
    stubs.hasUnpublishedChanges = sinon.stub(ct, 'hasUnpublishedChanges');
    stubs.publishedAt = sinon.stub(ct, 'getPublishedAt');
    ct.getName = stubs.getName;
    return _.extend(ct, extensions);
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['resetContentTypes', 'getName']);
    });
    inject(function ($rootScope, $controller, SpaceContext, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('space');
      scope.spaceContext = cfStub.spaceContext(space, [
        cfStub.contentTypeData('typeid1', [
          cfStub.field('name1')
        ]),
        cfStub.contentTypeData('typeid2', [
          cfStub.field('name2')
        ])
      ]);

      scope.context = {};
      scope.searchTerm = null;

      controller = $controller('ContentTypeListController', {$scope: scope});
      scope.$digest();
    });
  });

  it('content types are set', function() {
    expect(scope.contentTypes).toBeDefined();
  });

  it('first content type is set', function() {
    expect(scope.contentTypes[0].data.fields[0].name).toEqual('name1');
  });

  it('empty flag is false', function() {
    expect(scope.empty).toBeFalsy();
  });

  it('getting number of fields from a content type', function() {
    expect(scope.numFields(scope.contentTypes[0])).toEqual(1);
  });

  describe('empty content types', function() {
    beforeEach(function() {
      delete scope.spaceContext.contentTypes;
      scope.$digest();
    });

    it('content types are empty', function() {
      expect(scope.contentTypes).toEqual([]);
    });

    it('empty flag is true', function() {
      expect(scope.empty).toBeTruthy();
    });
  });

  describe('on search term change', function () {
    beforeEach(function() {
      scope.resetContentTypes = sinon.stub();
    });

    describe('if term is null', function () {
      beforeEach(function () {
        scope.searchTerm = null;
        scope.$digest();
      });

      it('list is not defined', function () {
        expect(scope.context.list).toBeUndefined();
      });

      it('reset content types not called', function () {
        sinon.assert.notCalled(scope.resetContentTypes);
      });
    });

    describe('if term is set', function () {
      beforeEach(function () {
        scope.searchTerm = 'thing';
        scope.$digest();
      });

      it('list is defined', function () {
        expect(scope.context.list).toBe('all');
      });

      it('reset content types is called', function() {
        sinon.assert.called(scope.resetContentTypes);
      });
    });

  });

  describe('switching lists', function () {
    var list;
    beforeEach(function() {
      list = 'all';
      scope.resetContentTypes = sinon.stub();
    });

    it('sets search term to null', function() {
      scope.context.list = list;
      scope.switchList(list);
      expect(scope.searchTerm).toBeNull();
    });

    it('resets current list', function () {
      scope.context.list = list;
      scope.switchList(list);
      sinon.assert.called(scope.resetContentTypes);
    });

    it('switches current list', function () {
      scope.switchList(list);
      expect(scope.context.list).toBe(list);
    });
  });

  describe('scope.visibleContentTypes', function () {
    it('only contains content types matched by the search', function () {
      var matched = makeCT({getName: sinon.stub().returns('MATCH')});
      var unmatched = makeCT();
      scope.contentTypes = [matched, unmatched];
      this.$apply();
      expect(scope.visibleContentTypes).toEqual([matched, unmatched]);

      scope.searchTerm = 'MAT';
      this.$apply();
      expect(scope.visibleContentTypes).toEqual([matched]);
    });

    it('it does not include deleted content types', function () {
      scope.contentTypes = [makeCT({isDeleted: sinon.stub().returns(true)})];
      this.$apply();
      expect(scope.visibleContentTypes.length).toBe(0);
    });
  });

  describe('resetting content types', function() {
    beforeEach(function() {
      stubs.refreshContentTypes = sinon.stub(scope.spaceContext, 'refreshContentTypes');
    });

    it('refreshes content types if a spaceContext exists', function() {
      scope.resetContentTypes();
      sinon.assert.called(stubs.refreshContentTypes);
    });

    it('does not refresh content types if a spaceContext doesnt exist', function() {
      delete scope.spaceContext;
      scope.resetContentTypes();
      sinon.assert.notCalled(stubs.refreshContentTypes);
    });
  });

  it('has a query', function() {
    scope.context.list = 'all';
    scope.searchTerm = 'term';
    expect(scope.hasQuery()).toBeTruthy();
  });

  it('has no query', function() {
    scope.context.list = 'all';
    scope.searchTerm = null;
    expect(scope.hasQuery()).toBeFalsy();
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
