'use strict';

describe('Kaltura Player Directive', function() {
  var kalturaCredentials, kalturaCredentialsDeferred, kalturaWidgetLoader, kalturaWidgetLoaderDeferred,
      scope, $rootScope, $window;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      $provide.value('kalturaCredentials', jasmine.createSpyObj('kalturaCredentialsSpy', ['get']));
      $provide.value('kalturaWidgetLoader', jasmine.createSpyObj('kalturaWidgetLoaderMock', ['load']));
    });

    inject(function($compile, $injector, $q){
      var directive;

      kalturaWidgetLoader = $injector.get('kalturaWidgetLoader');
      kalturaCredentials  = $injector.get('kalturaCredentials');
      $rootScope          = $injector.get('$rootScope');
      $window             = $injector.get('$window');

      kalturaCredentialsDeferred = $q.defer();
      kalturaCredentials.get.and.returnValue(kalturaCredentialsDeferred.promise);

      kalturaWidgetLoaderDeferred = $q.defer();
      kalturaWidgetLoader.load.and.returnValue(kalturaWidgetLoaderDeferred.promise);

      scope              = $rootScope.$new();
      scope.spaceContext = {space: { getOrganizationId: sinon.stub() }};
      scope.spaceContext.space.getOrganizationId.returns('org-123');

      scope.videoWidgetPlayer = {
        attrs: {},
        callbacks: {
          onInit: jasmine.createSpy()
        }
      };

      directive = [
        '<cf-kaltura-player',
        'on-init="on-init-callback"',
        'on-ready="on-ready-callback"',
        'on-failed-to-load-video="on-failed-to-load-video-callback"',
        '/>'
      ].join(' ');

      $compile(directive)(scope);
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  it('gets the kaltura credentials to load the player', function() {
    expect(kalturaCredentials.get).toHaveBeenCalledWith('org-123');
  });

  it('calls the "onInit" callback', function() {
    expect(scope.videoWidgetPlayer.callbacks.onInit).toHaveBeenCalled();
  });

  describe('when the kaltura credentials are succesfully retrieved', function() {
    beforeEach(function() {
      kalturaCredentialsDeferred.resolve({partner_id: 123, uiconf_id: 456});
      $rootScope.$apply();
    });

    it('loads the widget library', function() {
      expect(kalturaWidgetLoader.load).toHaveBeenCalledWith(123, 456);
    });

    describe('when the library is successfully loaded', function() {
      beforeEach(function() {
        $window.mw      = jasmine.createSpyObj('mwMock', ['setConfig']);
        $window.kWidget = jasmine.createSpyObj('kWidgetMock', ['embed']);

        kalturaWidgetLoaderDeferred.resolve();
        $rootScope.$apply();
      });

      describe('player instantiation', function() {
        it('configs the player to be HTML5', function() {
          expect($window.mw.setConfig).toHaveBeenCalledWith('Kaltura.LeadWithHTML5', true);
        });

        it('embeds the player', function() {
          expect($window.kWidget.embed).toHaveBeenCalled();
        });
      });
    });
  });
});
