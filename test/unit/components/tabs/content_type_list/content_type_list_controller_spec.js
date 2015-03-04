'use strict';

describe('Content Type List Controller', function () {
  var controller, scope, stubs;

  var makeCT = function (sys) {
    var ct;
    inject(function (privateContentfulClient) {
      ct = new privateContentfulClient.Entity({ sys: sys || {} });
    });
    stubs.deleted = sinon.stub(ct, 'isDeleted');
    stubs.published = sinon.stub(ct, 'isPublished');
    stubs.hasUnpublishedChanges = sinon.stub(ct, 'hasUnpublishedChanges');
    stubs.publishedAt = sinon.stub(ct, 'getPublishedAt');
    ct.getName = stubs.getName;
    return ct;
  };

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

      scope.tab = {
        params: {}
      };
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
        expect(scope.tab.params.list).toBeUndefined();
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
        expect(scope.tab.params.list).toBe('all');
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
      scope.tab.params.list = list;
      scope.switchList(list);
      expect(scope.searchTerm).toBeNull();
    });

    it('resets current list', function () {
      scope.tab.params.list = list;
      scope.switchList(list);
      sinon.assert.called(scope.resetContentTypes);
    });

    it('switches current list', function () {
      scope.switchList(list);
      expect(scope.tab.params.list).toBe(list);
    });
  });

  describe('changed list', function () {
    it('content type is filtered by search', function () {
      var contentType = makeCT();
      stubs.getName.returns('Type Name');
      scope.searchTerm = 'type';
      expect(scope.visibleInCurrentList(contentType)).toBeTruthy();
    });

    it('content type is included in all', function () {
      var contentType = makeCT();
      stubs.deleted.returns(false);
      scope.tab.params.list = 'all';
      expect(scope.visibleInCurrentList(contentType)).toBeTruthy();
    });

    it('content type is included in changed', function () {
      var contentType = makeCT();
      stubs.hasUnpublishedChanges.returns(true);
      scope.tab.params.list = 'changes';
      expect(scope.visibleInCurrentList(contentType)).toBeTruthy();
    });

    it('content type is included in active', function () {
      var contentType = makeCT();
      stubs.published.returns(true);
      scope.tab.params.list = 'active';
      expect(scope.visibleInCurrentList(contentType)).toBeTruthy();
    });

    it('content type is included in draft', function () {
      var contentType = makeCT();
      stubs.published.returns(false);
      scope.tab.params.list = 'draft';
      expect(scope.visibleInCurrentList(contentType)).toBeTruthy();
    });

    it('content type is not contained in any list', function () {
      var contentType = makeCT();
      scope.tab.params.list = '';
      expect(scope.visibleInCurrentList(contentType)).toBeTruthy();
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
    scope.tab.params.list = 'all';
    scope.searchTerm = 'term';
    expect(scope.hasQuery()).toBeTruthy();
  });

  it('has no query', function() {
    scope.tab.params.list = 'all';
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

  describe('when tab becomes active', function () {
    beforeEach(function() {
      scope.resetContentTypes = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      sinon.assert.notCalled(scope.resetContentTypes);
    }));

    it('resets content types', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      sinon.assert.called(scope.resetContentTypes);
    }));
  });

});
