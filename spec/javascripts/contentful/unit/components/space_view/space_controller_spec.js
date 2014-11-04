'use strict';

describe('Space Controller', function () {
  var spaceController, scope, stubs, $q;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'authUpdated',
        'periodUsage',
        'computeUsage',
        'setSpaceContext',
        'enforcement',
        'track',
        'error',
        'localesStub'
      ]);

      $provide.value('authorization', {
        isUpdated: stubs.authUpdated
      });

      $provide.value('authentication', {
      });

      $provide.value('enforcements', {
        getPeriodUsage: stubs.periodUsage,
        computeUsage: stubs.computeUsage,
        determineEnforcement: stubs.enforcement,
        setSpaceContext: stubs.setSpaceContext
      });

      $provide.value('analytics', {
        track: stubs.track
      });

      $provide.value('notification', {
        serverError: stubs.error
      });
    });
    inject(function ($controller, $rootScope, cfStub, _$q_){
      $q = _$q_;
      scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      spaceController = $controller('SpaceController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('watches for new locales', function () {
    var privateStub, refreshStub;
    beforeEach(function () {
      privateStub = sinon.stub();
      refreshStub = sinon.stub();
      scope.spaceContext.space.getPrivateLocales = privateStub;
      scope.spaceContext.refreshLocales = refreshStub;
    });

    it('refreshes locales if new locales are available', function () {
      privateStub.returns([
        {code: 'en-US'},
        {code: 'pt-PT'}
      ]);
      scope.$digest();
      expect(refreshStub).toBeCalled();
    });

    it('does not refresh locales if no new locales are available', function () {
      scope.spaceContext.space = null;
      scope.$digest();
      expect(refreshStub).not.toBeCalled();
    });
  });

  describe('refreshes active locales if locale states change', function () {
    var refreshStub;
    beforeEach(function () {
      scope.$digest();
      refreshStub = sinon.stub(scope.spaceContext, 'refreshActiveLocales');
      scope.spaceContext.localeStates['pt-PT'] = true;
      scope.$digest();
    });

    afterEach(function () {
      refreshStub.restore();
    });

    it('calls refresh method', function () {
      expect(refreshStub).toBeCalled();
    });
  });

  describe('refreshes content types if spaceContext changes', function () {
    var refreshStub;
    beforeEach(function () {
      scope.$digest();
      refreshStub = sinon.stub();
      scope.spaceContext = {
        refreshContentTypes: refreshStub,
        refreshActiveLocales: stubs.localesStub
      };
      scope.$digest();
    });

    it('calls refresh method', function () {
      expect(refreshStub).toBeCalled();
    });
  });

  describe('watches for updated tokenLookup', function () {
    var broadcastStub;
    beforeEach(inject(function (authentication, $rootScope) {
      authentication.tokenLookup = {};
      stubs.authUpdated.returns(true);
      stubs.periodUsage.returns(true);
      broadcastStub = sinon.stub($rootScope, '$broadcast');
      scope.$digest();
    }));

    afterEach(function () {
      broadcastStub.restore();
    });

    it('gets period usage', function () {
      expect(stubs.periodUsage).toBeCalled();
    });

    it('broadcasts event if usage exceeded', function () {
      expect(broadcastStub).toBeCalled();
    });
  });

  describe('can method for permissions', function () {
    var canStub;
    var result, args;
    beforeEach(inject(function (authorization) {
      args = [1, 2];
      canStub = sinon.stub();
      authorization.spaceContext = {
        can: canStub
      };
      scope.checkForEnforcements = sinon.stub();
    }));

    describe('if there is no space context', function () {
      beforeEach(inject(function (authorization) {
        authorization.spaceContext = null;
      }));

      it('can is not called', function () {
        expect(canStub).not.toBeCalled();
      });

      it('response is returned', function () {
        expect(result).toBeFalsy();
      });

      it('doesnt check for enforcements', function() {
        expect(scope.checkForEnforcements).not.toBeCalled();
      });
    });

    describe('if permission succeeds', function () {
      beforeEach(function () {
        canStub.returns(true);
        result = scope.can(args, {});
      });

      it('can is called', function () {
        expect(canStub).toBeCalledWith(args);
      });

      it('response is returned', function () {
        expect(result).toBeTruthy();
      });

      it('doesnt check for enforcements', function() {
        expect(scope.checkForEnforcements).not.toBeCalled();
      });
    });

    describe('if permission fails', function () {
      beforeEach(function () {
        canStub.returns(false);
        result = scope.can(args, {});
      });

      it('can is called', function () {
        expect(canStub).toBeCalledWith(args);
      });

      it('response is returned', function () {
        expect(result).toBeFalsy();
      });

      it('checks for enforcements', function() {
        expect(scope.checkForEnforcements).toBeCalled();
      });
    });

  });

  it('analytics event fired on logo clicked', function () {
    scope.logoClicked();
    expect(stubs.track).toBeCalled();
  });

  describe('broadcasts an event from space', function () {
    var broadcastStub;
    beforeEach(inject(function ($rootScope) {
      broadcastStub = sinon.stub($rootScope, '$broadcast');
    }));

    afterEach(function () {
      broadcastStub.restore();
    });

    it('broadcast is called', function () {
      scope.broadcastFromSpace();
      expect(broadcastStub).toBeCalled();
    });
  });

  describe('creates an entry', function () {
    var createStub;
    var contentType;
    beforeEach(inject(function (cfStub) {
      createStub = sinon.stub(scope.spaceContext.space, 'createEntry').returns($q.defer().promise);
      contentType = cfStub.contentType(scope.spaceContext.space, 'thing', 'Thing');
    }));

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      scope.createEntry(contentType);
      expect(createStub).toBeCalled();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.returns($q.reject({
          body: {
            details: {
              reasons: []
            }
          }
        }));
        scope.createEntry(contentType);
        scope.$apply();
      });

      it('determines enforcements', function () {
        expect(stubs.enforcement).toBeCalledWith([], 'entry');
      });

      it('notifies of the error', function () {
        expect(stubs.error).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(function () {
        editorStub = sinon.stub();
        editorStub.returns({goTo: sinon.stub()});
        scope.navigator = {
          entryEditor: editorStub
        };
        createStub.returns($q.when({}));
        scope.createEntry(contentType);
        scope.$apply();
      });

      it('navigates to editor', function () {
        expect(editorStub).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });
  });

  describe('creates an asset', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(scope.spaceContext.space, 'createAsset').returns($q.defer().promise);
    });

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      scope.createAsset();
      expect(createStub).toBeCalled();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.returns($q.reject({
          body: {
            details: {
              reasons: []
            }
          }
        }));
        scope.createAsset();
        scope.$apply();
      });

      it('determines enforcements', function () {
        expect(stubs.enforcement).toBeCalledWith([], 'asset');
      });

      it('notifies of the error', function () {
        expect(stubs.error).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(inject(function (cfStub) {
        editorStub = sinon.stub();
        editorStub.returns({goTo: sinon.stub()});
        scope.navigator = {
          assetEditor: editorStub
        };
        createStub.returns($q.when(cfStub.asset(scope.spaceContext.space, 'image')));
        scope.createAsset();
        scope.$apply();
      }));

      it('navigates to editor', function () {
        expect(editorStub).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });
  });

  describe('creates a content type', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(scope.spaceContext.space, 'createContentType').returns($q.defer().promise);
    });

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      scope.createContentType();
      expect(createStub).toBeCalled();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.returns($q.reject({
          body: {
            details: {
              reasons: []
            }
          }
        }));
        scope.createContentType();
        scope.$apply();
      });

      it('determines enforcements', function () {
        expect(stubs.enforcement).toBeCalledWith([], 'contentType');
      });

      it('notifies of the error', function () {
        expect(stubs.error).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(function () {
        editorStub = sinon.stub();
        editorStub.returns({goTo: sinon.stub()});
        scope.navigator = {
          contentTypeEditor: editorStub
        };
        createStub.returns($q.when({}));
        scope.createContentType();
        scope.$apply();
      });

      it('navigates to editor', function () {
        expect(editorStub).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });
  });

  describe('creates an api key', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(scope.spaceContext.space, 'createBlankDeliveryApiKey');
    });

    afterEach(function () {
      createStub.restore();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        stubs.computeUsage.returns({});
        scope.createApiKey();
      });

      it('computes the api key usage', function () {
        expect(stubs.computeUsage).toBeCalledWith('apiKey');
      });

      it('notifies of the error', function () {
        expect(stubs.error).toBeCalled();
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(function () {
        editorStub = sinon.stub();
        editorStub.returns({openAndGoTo: sinon.stub()});
        scope.navigator = {
          apiKeyEditor: editorStub
        };
        stubs.computeUsage.returns(null);
        scope.createApiKey();
      });

      it('computes the api key usage', function () {
        expect(stubs.computeUsage).toBeCalledWith('apiKey');
      });

      it('calls the space create method', function () {
        expect(createStub).toBeCalled();
      });

      it('navigates to editor', function () {
        expect(editorStub).toBeCalled();
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });
    });
  });


});
