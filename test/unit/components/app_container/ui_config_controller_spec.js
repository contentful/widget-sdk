'use strict';

describe('UiConfigController', function () {
  var scope, stubs;

  afterEach(function () {
    scope = stubs = null;
  });

  beforeEach(function () {
    stubs = {
      uiConfig: {
        load: sinon.stub(),
        save: sinon.stub(),
        get: _.noop
      },
      spaceContext: {
        space: {
          getUIConfig: sinon.stub(),
          setUIConfig: sinon.stub(),
          isAdmin: sinon.stub()
        },
        getData: sinon.stub()
      }
    };

    module('contentful/test', function ($provide) {
      $provide.value('uiConfig', stubs.uiConfig);
      $provide.value('spaceContext', stubs.spaceContext);
    });
    inject(function ($controller, $rootScope, $q) {
      stubs.uiConfig.load.resolves({});
      stubs.uiConfig.save.resolves();
      scope = $rootScope.$new();
      var get = $q.defer();
      var set = $q.defer();
      stubs.spaceContext.space.getUIConfig.returns(get.promise);
      stubs.spaceContext.space.getUIConfig.returns(set.promise);
      stubs.spaceContext.space.isAdmin.returns(true);
      $controller('UiConfigController', {$scope: scope});
      scope.$apply();
    });
  });


  describe('loading a space', function () {
    it('calls the uiConfig load method', function () {
      sinon.assert.calledOnce(stubs.uiConfig.load);
    });
  });

  describe('saving UI config', function () {
    it('should allow editing for admins', function () {
      scope.saveUiConfig();
      expect(scope.canEditUiConfig).toBe(true);
      sinon.assert.calledOnce(stubs.uiConfig.save);
    });

    it('should not allow editing for non-admins', function () {
      stubs.spaceContext.space.isAdmin.returns(false);
      scope.$apply();
      scope.saveUiConfig();
      sinon.assert.notCalled(stubs.uiConfig.save);
      expect(scope.canEditUiConfig).toBe(false);
    });
  });
});
