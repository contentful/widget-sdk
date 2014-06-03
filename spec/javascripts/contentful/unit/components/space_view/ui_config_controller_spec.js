'use strict';

describe('UiConfigController', function () {
  var scope, controller;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    scope.spaceContext = {
      space: {
        getUIConfig: sinon.stub(),
        setUIConfig: sinon.stub(),
        isAdmin: sinon.stub().returns(true)
      }
    };
    controller = $controller('UiConfigController', {$scope: scope});
    scope.$apply();
  }));
  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('loading a space', function () {
    describe('loads ui config', function() {
      it('initializes a non existing config', function() {
        scope.spaceContext.space.getUIConfig.yield({statusCode: 404}, null);
        expect(scope.uiConfig).toEqual({});
      });

      it('loads an existing config', function() {
        scope.spaceContext.space.getUIConfig.yield(null, 'config');
        expect(scope.uiConfig).toBe('config');
      });
    });
  });

  describe('unloading a space', function () {
    beforeEach(function () {
      scope.spaceContext.space.getUIConfig.yield(null, 'config');
      expect(scope.uiConfig).toBe('config');
    });

    it('removes a ui config', function () {
      scope.spaceContext = {};
      scope.$apply();
      expect(scope.uiConfig).toBe(null);
    });
  });
  
  describe('saving ui config', function () {
    it('should cancel the save if not allowed', function () {
      scope.canEditUiConfig = false;
      scope.saveUiConfig().catch(function (err) {
        expect(err).toBe('Not allowed');
      });
      scope.$apply();
    });

    it('should replace the current uiConfig with the value from the server', function () {
      scope.saveUiConfig().then(function (config) {
        expect(config).toBe('config');
      });
      scope.spaceContext.space.setUIConfig.yield(null, 'config');
      expect(scope.uiConfig).toBe('config');
    });

    it('should load ui config on failure', function () {
      scope.saveUiConfig();
      scope.spaceContext.space.setUIConfig.yield('error', null);
      scope.spaceContext.space.getUIConfig.yield(null, 'oldConfig');
      expect(scope.uiConfig).toBe('oldConfig');
    });
  });

  describe('determining editability', function () {
    it('should allow editing for admins', function () {
      expect(scope.canEditUiConfig).toBe(true);
    });

    it('should not allow editing for non-admins', function () {
      scope.spaceContext.space.isAdmin.returns(false);
      scope.$apply();
      expect(scope.canEditUiConfig).toBe(false);
    });
  });
});

