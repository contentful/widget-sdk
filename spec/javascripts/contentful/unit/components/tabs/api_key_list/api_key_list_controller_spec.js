'use strict';

describe('API Key List Controller', function () {
  var controller, scope, apiErrorHandler;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, cfStub, ReloadNotification) {
      scope = $rootScope.$new();
      apiErrorHandler = ReloadNotification.apiErrorHandler;

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      controller = $controller('ApiKeyListCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
      getApiKeysStub = sinon.stub(scope.spaceContext.space, 'getDeliveryApiKeys');
      scope.refreshApiKeys();
      getApiKeysStub.yield(null, {});
      scope.$apply();
    });

    it('calls api keys getter', function() {
      expect(getApiKeysStub).toBeCalled();
    });

    it('saves api keys on scope', function() {
      expect(scope.apiKeys).toEqual({});
    });
  });

  describe('refreshing api keys fails', function () {
    var getApiKeysStub;
    beforeEach(function() {
      getApiKeysStub = sinon.stub(scope.spaceContext.space, 'getDeliveryApiKeys');
      scope.refreshApiKeys();
      getApiKeysStub.yield({statusCode: 500}, null);
      scope.$apply();
    });

    it('results in an error message', function () {
      expect(apiErrorHandler).toBeCalled();
    });

  });

  describe('when tab becomes active', function () {
    beforeEach(function() {
      scope.refreshApiKeys = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      expect(scope.refreshApiKeys).not.toBeCalled();
    }));

    it('resets api keys', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.refreshApiKeys).toBeCalled();
    }));
  });

});
