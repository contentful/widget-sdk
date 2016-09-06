'use strict';

describe('API Key List Controller', function () {
  let scope, apiErrorHandler;

  const stubs = {
    spaceContext: {
      getData: function () { return 2; },
      space: {
        getOrganizationId: _.constant(1)
      }
    },
    apiKeyController: {
      getApiKeyList: sinon.stub()
    },
    newApiKey: _.noop
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', stubs.spaceContext);
      $provide.removeController('ApiController');
    });

    inject(function ($rootScope, $controller, ReloadNotification) {
      apiErrorHandler = ReloadNotification.apiErrorHandler;
      scope = $rootScope.$new();
      scope.context = {};

      this.create = function () {
        $controller('ApiKeyListController', {
          $scope: _.extend(scope, {
            apiKeyController: stubs.apiKeyController,
            entityCreationController: {
              newApiKey: stubs.newApiKey
            }
          })
        });
        scope.$digest();
      };
    });
  });

  describe('empty marker', function () {
    it('is true', function () {
      stubs.apiKeyController.getApiKeyList.resolves([]);
      this.create();
      expect(scope.empty).toBeTruthy();
    });

    it('is false', function () {
      stubs.apiKeyController.getApiKeyList.resolves([{}]);
      this.create();
      expect(scope.empty).toBeFalsy();
    });
  });

  describe('has reached the API keys limit', function () {
    it('under keys limit', function () {
      stubs.apiKeyController.getApiKeyList.resolves([{}]);
      this.create();
      expect(scope.reachedLimit).toBeFalsy();
    });

    it('reached the limit', function () {
      stubs.apiKeyController.getApiKeyList.resolves([{}, {}]);
      this.create();
      expect(scope.reachedLimit).toBeTruthy();

    });

  });

  describe('refreshing api keys', function () {
    it('saves api keys on scope', function () {
      stubs.apiKeyController.getApiKeyList.resolves({});
      this.create();
      expect(scope.apiKeys).toEqual({});
    });
  });

  describe('refreshing api keys fails', function () {
    it('results in an error message', function () {
      stubs.apiKeyController.getApiKeyList.rejects();
      this.create();
      sinon.assert.called(apiErrorHandler);
    });
  });
});
