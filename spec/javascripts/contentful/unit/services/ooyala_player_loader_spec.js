'use strict';

describe('ooyalaPlayerLoader', function() {
  var angularLoadDeferred, angularLoadSpy, ooyalaPlayerLoader,
      ooyalaPlayerLoaderPromise, baseUrl, $window, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      angularLoadSpy = {loadScript: jasmine.createSpy()};
      $provide.value('angularLoad', angularLoadSpy);
    });

    inject(function($q, $injector){
      $rootScope         = $injector.get('$rootScope');
      $window            = $injector.get('$window');
      ooyalaPlayerLoader = $injector.get('ooyalaPlayerLoader');

      angularLoadDeferred = $q.defer();
      angularLoadSpy.loadScript.and.returnValue(angularLoadDeferred.promise);

      $window.OO = {ready : jasmine.createSpy()};

    });

    baseUrl =  '//player.ooyala.com/v3/:player_id?platform=priority-html5';
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('#load', function() {
    var expectedUrl;

    beforeEach(function() {
      ooyalaPlayerLoaderPromise = ooyalaPlayerLoader.load('123');
      expectedUrl = baseUrl.replace(':player_id', '123');
    });

    it('uses the right url', function() {
      var url = angularLoadSpy.loadScript.calls.mostRecent().args[0];
      expect(url).toBe(expectedUrl);
    });

    describe('on sucess', function() {
      beforeEach(function() {
        angularLoadDeferred.resolve();
        $rootScope.$apply();
      });

      it('installs a callback to know when the player is ready', function() {
        expect($window.OO.ready).toHaveBeenCalled();
      });

      describe('on player ready', function() {
        var player;

        beforeEach(function() {
          var readyCallback = $window.OO.ready.calls.mostRecent().args[0];
          ooyalaPlayerLoaderPromise.then(function(_player_){ player = _player_; });
          readyCallback();
          $rootScope.$apply();
        });

        it('resolves the promise passing the player as parameter', function() {

          expect(player).toBe($window.OO);
        });
      });
    });

    describe('on failure', function() {
      beforeEach(function() {
        angularLoadDeferred.reject();
        $rootScope.$apply();
      });

      it('does not install a callback to know when the player is ready', function() {
        expect($window.OO.ready).not.toHaveBeenCalled();
      });
    });
  });
});
