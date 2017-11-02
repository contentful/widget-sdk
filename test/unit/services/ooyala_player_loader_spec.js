'use strict';

describe('ooyalaPlayerLoader', function () {
  let angularLoadDeferred, angularLoadSpy, ooyalaPlayerLoader;
  let ooyalaPlayerLoaderPromise, baseUrl, $window, $rootScope;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      angularLoadSpy = {loadScript: jasmine.createSpy()};
      $provide.value('angularLoad', angularLoadSpy);
    });

    inject(function ($q, $injector) {
      $rootScope = $injector.get('$rootScope');
      $window = $injector.get('$window');
      ooyalaPlayerLoader = $injector.get('ooyalaPlayerLoader');

      angularLoadDeferred = $q.defer();
      angularLoadSpy.loadScript.and.returnValue(angularLoadDeferred.promise);

      $window.OO = {ready: jasmine.createSpy()};
    });

    baseUrl = '//player.ooyala.com/v3/:player_id?platform=priority-html5';
  });

  describe('#load', function () {
    let expectedUrl, url;

    beforeEach(function () {
      ooyalaPlayerLoaderPromise = ooyalaPlayerLoader.load('123');
      expectedUrl = baseUrl.replace(':player_id', '123');
      url = angularLoadSpy.loadScript.calls.mostRecent().args[0];
    });

    it('uses the right url', function () {
      expect(url).toBe(expectedUrl);
    });

    describe('on sucess', function () {
      beforeEach(function () {
        angularLoadDeferred.resolve();
        $rootScope.$apply();
      });

      it('installs a callback to know when the player is ready', function () {
        expect($window.OO.ready).toHaveBeenCalled();
      });

      describe('on player ready', function () {
        let player;

        beforeEach(function () {
          ooyalaPlayerLoaderPromise.then(function (_player_) { player = _player_; });
          $window.OO.ready.calls.mostRecent().args[0](); // call the 'readyCallback'
          $rootScope.$apply();
        });

        it('resolves the promise passing the player as parameter', function () {
          expect(player).toBe($window.OO);
        });
      });
    });

    describe('on failure', function () {
      beforeEach(function () {
        angularLoadDeferred.reject();
        $rootScope.$apply();
      });

      it('does not install a callback to know when the player is ready', function () {
        expect($window.OO.ready).not.toHaveBeenCalled();
      });
    });
  });
});
