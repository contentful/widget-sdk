'use strict';

describe('Content Type List Controller', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($rootScope, $controller, SpaceContext) {
    $rootScope.spaceContext = new SpaceContext(window.createMockSpace());
    controller = $controller('ContentTypeListCtrl', {$scope: $rootScope});
    scope = $rootScope;
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('list filtering', function () {
    var makeContentType = function (params) {
      var contentType;
      inject(function (contentfulClient) {
        contentType = new contentfulClient.Entity(params);
        contentType.getName = function () {
          return params.data.name;
        };
      });
      return contentType;
    };

    describe('on searching', function () {
      it('searches for an existing name', function () {
        scope.searchTerm = 'term';
        var contentType = makeContentType({
          data: {
            name: 'some term'
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('lowercase search for an existing name capitalized', function () {
        scope.searchTerm = 'term';
        var contentType = makeContentType({
          data: {
            name: 'some Term'
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('searches for a non existing name', function () {
        scope.searchTerm = 'term';
        var contentType = makeContentType({
          data: {
            name: 'does not exist'
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(false);
      });

    });

    describe('on all list', function () {
      beforeEach(function () {
        scope.tab = {
          params: {
            list: 'all'
          }
        };
      });

      it('should include unpublished contentTypes in "changed" list', function () {
        var contentType = makeContentType({
          sys: {
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('should include updated contentTypes in "changed" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 2,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('should include published contentTypes without updates in "changed" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 5,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });
    });

    describe('on changed list', function () {
      beforeEach(function () {
        scope.tab = {
          params: {
            list: 'changed'
          }
        };
      });

      it('should include unpublished contentTypes in "changed" list', function () {
        var contentType = makeContentType({
          sys: {
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('should include updated contentTypes in "changed" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 2,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('should not include published contentTypes without updates in "changed" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 5,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(false);
      });
    });

    describe('on active list', function () {
      beforeEach(function () {
        scope.tab = {
          params: {
            list: 'active'
          }
        };
      });

      it('should not include unpublished contentTypes in "active" list', function () {
        var contentType = makeContentType({
          sys: {
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(false);
      });

      it('should include updated contentTypes in "active" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 2,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('should include published contentTypes without updates in "active" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 5,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });
    });

    describe('on inactive list', function () {
      beforeEach(function () {
        scope.tab = {
          params: {
            list: 'inactive'
          }
        };
      });

      it('should include unpublished contentTypes in "inactive" list', function () {
        var contentType = makeContentType({
          sys: {
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(true);
      });

      it('should not include updated contentTypes in "inactive" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 2,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(false);
      });

      it('should not include published contentTypes without updates in "inactive" list', function () {
        var contentType = makeContentType({
          sys: {
            publishedVersion: 5,
            version: 5
          }
        });
        expect(scope.visibleInCurrentList(contentType)).toBe(false);
      });
    });


  });

});
