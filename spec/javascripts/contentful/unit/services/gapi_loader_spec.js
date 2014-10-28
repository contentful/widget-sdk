'use strict';

describe('GAPI Loader', function() {
  var defer, GAPIAdapter, loader, googleScriptLoader, $q, $window, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      GAPIAdapter        = 'gapi';
      $provide.value('GAPIAdapter', GAPIAdapter);
    });

    inject(function($injector){
      loader             = $injector.get('gapiLoader');
      googleScriptLoader = $injector.get('googleScriptLoader');
      $window            = $injector.get('$window');
      $rootScope         = $injector.get('$rootScope');
      $q                 = $injector.get('$q');
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  it('sets the expected callback function', function() {
    spyOn(googleScriptLoader, 'load').and.callThrough();

    loader.load();

    var src          = googleScriptLoader.load.calls.mostRecent().args[0];
    var callback     = googleScriptLoader.load.calls.mostRecent().args[1];
    var callbackName = src.match(/onload=(\w+)/)[1];

    expect(callback.name).toBe(callbackName);
  });

  describe('on successful load', function() {
    beforeEach(function() {
      defer      = $q.defer();

      spyOn(googleScriptLoader, 'load').and.returnValue(defer.promise);
    });

    it('returns the GAPIAdapter object', function() {
      var gapi;

      loader.load().then(function(_gapi_){ gapi = _gapi_; });

      defer.resolve();
      $rootScope.$apply();

      expect(gapi).toEqual(GAPIAdapter);
    });
  });
});
