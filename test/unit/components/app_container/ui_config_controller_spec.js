'use strict';

describe('UiConfigController', function () {
  var scope, controller, stubs;

  stubs = {
    uiConfig: {
      load: sinon.stub(),
      save: sinon.stub()
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

  afterEach(function () {
    scope = controller = null;
  });

  beforeEach(function() {
    module('contentful/test', function($provide) {
      $provide.value('uiConfig', stubs.uiConfig);
      $provide.value('spaceContext', stubs.spaceContext);
    });
  });

  beforeEach(inject(function ($controller, $rootScope, $q) {
    stubs.uiConfig.load.resolves({});
    scope = $rootScope.$new();
    var get = $q.defer();
    var set = $q.defer();
    stubs.spaceContext.space.getUIConfig.returns(get.promise);
    stubs.spaceContext.space.getUIConfig.returns(set.promise);
    stubs.spaceContext.space.isAdmin.returns(true);
    controller = $controller('UiConfigController', {$scope: scope});
    scope.$apply();
  }));

  describe('loading a space', function() {
    it('calls the uiConfig load method', function() {
      stubs.uiConfig.save.resolves();
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
      stubs.uiConfig.save = sinon.stub().resolves();
      stubs.spaceContext.space.isAdmin.returns(false);
      scope.$apply();
      scope.saveUiConfig();
      sinon.assert.notCalled(stubs.uiConfig.save);
      expect(scope.canEditUiConfig).toBe(false);
    });
  });
});

