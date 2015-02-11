'use strict';

describe('Kaltura Widget Loader', function() {
  var angularLoadDeferred, angularLoadMock, kalturaWidgetLoader, $rootScope, $window;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      angularLoadMock = jasmine.createSpyObj('angularLoadMock', ['loadScript']);
      $provide.value('angularLoad', angularLoadMock);
    });

    inject(function($injector, $q){
      kalturaWidgetLoader = $injector.get('kalturaWidgetLoader');
      $rootScope          = $injector.get('$rootScope');
      $window             = $injector.get('$window');

      angularLoadDeferred = $q.defer();

      angularLoadMock.loadScript.and.returnValue(angularLoadDeferred.promise);
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('#load', function() {
    var kalturaWidgetLoaderPromise;
    beforeEach(function() {
      kalturaWidgetLoaderPromise = kalturaWidgetLoader.load(123, 456);
    });

    describe('sets up the widget endpoint url', function() {
      var partnerId, uiconfId, url, urlRegexp;
      beforeEach(function() {
        urlRegexp = /https:\/\/www.kaltura.com\/p\/(\d+)\/sp\/(\1)00\/embedIframeJs\/uiconf_id\/(\d+)\/partner_id\/(\1)/;
        url       = angularLoadMock.loadScript.calls.mostRecent().args[0];
        partnerId = url.match(urlRegexp)[1];
        uiconfId  = url.match(urlRegexp)[3];
      });

      it('replaces the partner id', function(){
        expect(partnerId).toEqual('123');
      });

      it('replaces the uiconf id', function(){
        expect(uiconfId).toEqual('456');
      });
    });


    describe('on successful load', function() {
      var widget;
      beforeEach(function() {
        $window.kWidget = 'kaltura-widget';
        kalturaWidgetLoaderPromise.then(function(_widget_){ widget = _widget_; });
        angularLoadDeferred.resolve();

        $rootScope.$apply();
      });

      it('resolves the promise passing the player as parameter', function() {
        expect(widget).toEqual($window.kWidget);
      });
    });

    describe('on failed load', function() {
      var spy;
      beforeEach(function() {
        spy = jasmine.createSpy();
        kalturaWidgetLoaderPromise.catch(spy);
        angularLoadDeferred.reject();

        $rootScope.$apply();
      });
      it('rejects the promise', function() {
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
