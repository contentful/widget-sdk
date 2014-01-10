'use strict';

describe('API Key List Controller', function () {
  var controller, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: {
          marketing_url: 'marketing'
        }
      });
    });
    inject(function ($rootScope, $controller, cfStub) {
      scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      controller = $controller('ApiKeyListCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('gets a marketing url', function() {
    expect(scope.marketingUrl).toEqual('marketing');
  });

  describe('empty marker', function() {
    it('is true', function() {
      scope.apiKeys = [];
      scope.$digest();
      expect(scope.empty).toBeTruthy();
    });

    it('is false', function() {
      scope.apiKeys = [{}];
      scope.$digest();
      expect(scope.empty).toBeFalsy();
    });
  });

  describe('refreshing api keys', function() {
    var getApiKeysStub;
    beforeEach(function() {
      getApiKeysStub = sinon.stub(scope.spaceContext.space, 'getApiKeys');
      getApiKeysStub.callsArgWith(1, null, {});
      scope.refreshApiKeys();
    });

    it('calls api keys getter', function() {
      expect(getApiKeysStub.called).toBeTruthy();
    });

    it('saves api keys on scope', function() {
      expect(scope.apiKeys).toEqual({});
    });
  });

  describe('when tab becomes active', function () {
    beforeEach(function() {
      scope.refreshApiKeys = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      expect(scope.refreshApiKeys.called).toBeFalsy();
    }));

    it('resets api keys', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.refreshApiKeys.called).toBeTruthy();
    }));
  });

});
