'use strict';

describe('Google Script Loader', function () {
  var angularLoad, loader, callback, $window, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector){
      angularLoad = $injector.get('angularLoad');
      loader      = $injector.get('googleScriptLoader');
      $window     = $injector.get('$window');
      $rootScope  = $injector.get('$rootScope');
    });

    callback = {name: 'randomName', fn: angular.noop};
  });

  describe('#load', function() {
    it('returns the same deferred to calls loading the same script', function(){
      var pro_1 = loader.load('file.js', callback);
      var pro_2 = loader.load('file.js', callback);

      expect(pro_1).toEqual(pro_2);
    });

    it('set the callback on the global scope', function() {
      loader.load('file.js', callback);

      expect($window[callback.name]).toBeDefined();
    });

    describe('when the loading succeeds', function() {
      it('resolves the returned promise', function(){
        var spy = jasmine.createSpy();

        loader.load('file.js', callback).then(spy);

        expect(spy).not.toHaveBeenCalled();

        $window[callback.name]();
        $rootScope.$apply();

        expect(spy).toHaveBeenCalled();
      });

      it('removes the callback from the global scope', function() {
        loader.load('file.js', callback);
        expect($window[callback.name]).toBeDefined();

        $window[callback.name]();

        expect($window[callback.name]).toBeUndefined();
      });
    });

    describe('when the loading fails', function() {
      var fakePromise, spy, rejectCb;

      beforeEach(function() {
        spy         = jasmine.createSpy();
        fakePromise = jasmine.createSpyObj('promise', ['then']);
        spyOn(angularLoad, 'loadScript').and.returnValue(fakePromise);

        loader.load('file.js', callback).then(angular.noop, spy);
        rejectCb = fakePromise.then.calls.mostRecent().args[1];
      });

      it('rejects the returned promise', function(){

        expect(spy).not.toHaveBeenCalled();

        rejectCb.call();
        $rootScope.$apply();

        expect(spy).toHaveBeenCalled();
      });

      it('removes the callback from the global scope', function(){
        expect($window[callback.name]).toBeDefined();

        rejectCb.call();

        expect($window[callback.name]).toBeUndefined();
      });
    });

  });
});
