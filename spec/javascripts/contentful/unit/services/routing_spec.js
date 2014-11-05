'use strict';

describe('Routing service', function () {
  beforeEach(function () {
    module('contentful/test');
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('Space Controller', function () {
    var spaceController;
    beforeEach(inject(function ($controller, $rootScope, SpaceContext) {
      $rootScope.spaceContext = new SpaceContext({
        iAmASpace: true,
        getPrivateLocales: function () {
          return [];
        },
        getDefaultLocale: function () {
          return {code: 'en-US'};
        },
        getPublishedContentTypes: function (callback) {
          _.defer(callback, null, [{}]);
        },
        refreshPublishedContentTypes: angular.noop,
        getId: function () {
          return '123';
        },
        getContentTypes: function (params, callback) {
          _.defer(callback, null, []);
        }
      });
      spyOn($rootScope.spaceContext.tabList, 'add').and.returnValue({
        activate: function () { }
      });
      $controller('TabViewController', {$scope: $rootScope});
    }));

    // TODO randomly failing for some unknown reason
    xit('should visit the entryList if only the space was given', function(done){
      inject(function ($location, $rootScope, $controller, routing) {
        routing.getRoute(); // trigger routeProvider initialization
        $location.path('/spaces/123');
        $rootScope.$apply(); // Create route

        spyOn($rootScope, 'visitView');
        spaceController = $controller('SpaceController', {$scope: $rootScope});
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
    });
  });

  describe('Client Controller', function () {
    it('should update the route when a tab is activated');
    it('should change the space if the route was changed to a different space');
    it('should honor route.noNavigate');
  });

  describe('Space Controller', function () {
    it('should find an existing tab if the route was changed');
    it('should open a tab if the route was changed');
    it('should honor route.noNavigate');
  });

  describe('Routing', function () {
    
  });
});
