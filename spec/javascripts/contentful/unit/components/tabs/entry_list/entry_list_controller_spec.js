'use strict';

describe('Entry List Controller', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($rootScope, $controller) {
    controller = $controller('EntryListCtrl', {$scope: $rootScope});
    scope = $rootScope;
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('changed list', function () {
    var makeEntry = function (sys) {
      var entry;
      inject(function (contentfulClient) {
        entry = new contentfulClient.Entity({ sys: sys });
      });
      return entry;
    };

    beforeEach(function () {
      scope.tab = {
        params: {
          list: 'changed'
        }
      };
    });

    it('should include unpublished entries in "changed" list', function () {
      var entry = makeEntry({
        version: 5
      });
      expect(scope.visibleInCurrentList(entry)).toBe(true);
    });

    it('should include updated entries in "changed" list', function () {
      var entry = makeEntry({
        publishedVersion: 2,
        version: 5
      });
      expect(scope.visibleInCurrentList(entry)).toBe(true);
    });

    it('should not include published entries without updates in"changed" list', function () {
      var entry = makeEntry({
        publishedVersion: 5,
        version: 5
      });
      expect(scope.visibleInCurrentList(entry)).toBe(false);
    });
  });

  describe('loadMore', function () {
    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      var loadSpy;
      inject(function (PromisedLoader) { loadSpy = PromisedLoader.loadSpy; });

      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.spaceContext = {};
      scope.tab = {params: {}};
      scope.loadMore();
      expect(loadSpy.called).toBe(true);

    });
  });

});
