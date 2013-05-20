'use strict';

describe('Routing service', function () {
  beforeEach(function () {
    module('contentful/test');
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('Bucket Controller', function () {
    var bucketController;
    beforeEach(inject(function ($controller, $rootScope, BucketContext) {
      $rootScope.bucketContext = new BucketContext({
        iAmABucket: true,
        getPublishLocales: function () {
          return [];
        },
        getDefaultLocale: function () {
          return {code: 'en-US'};
        },
        getPublishedEntryTypes: function (callback) {
          _.defer(callback, null, [{}]);
        },
        refreshPublishedEntryTypes: function () {
          
        },
        getId: function () {
          return '123';
        },
        getEntryTypes: function (params, callback) {
          _.defer(callback, null, []);
        }
      });
      spyOn($rootScope.bucketContext.tabList, 'add').andReturn({
        activate: function () { }
      });
      $controller('TabViewCtrl', {$scope: $rootScope});
    }));

    it('should visit the entryList if only the bucket was given', inject(function ($location, $rootScope, $controller) {
      $location.path('/buckets/123');
      $rootScope.$apply(); // Create route

      spyOn($rootScope, 'visitView');
      this.async(function (done) {
        bucketController = $controller('BucketCtrl', {$scope: $rootScope});
        $rootScope.$apply(); // Trigger watcher initializing the Controller
        _.defer(function () { // Give callbacks a chance to return
          try {
            expect($rootScope.visitView).toHaveBeenCalledWith('entry-list');
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    }));
  });

  describe('Client Controller', function () {
    xit('should update the route when a tab is activated');
    xit('should change the bucket if the route was changed to a different bucket');
    xit('should honor route.noNavigate');
  });

  describe('Bucket Controller', function () {
    xit('should find an existing tab if the route was changed');
    xit('should open a tab if the route was changed');
    xit('should honor route.noNavigate');
  });

  describe('Routing', function () {
    
  });
});
