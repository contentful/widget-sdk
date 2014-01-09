'use strict';

describe('Space Controller', function () {
  var spaceController, scope;
  var authUpdatedStub, periodUsageStub, enforcementStub, trackStub, errorStub, computeUsageStub;

  beforeEach(function () {
    authUpdatedStub = sinon.stub();
    periodUsageStub = sinon.stub();
    computeUsageStub = sinon.stub();
    enforcementStub = sinon.stub();
    trackStub = sinon.stub();
    errorStub = sinon.stub();
    module('contentful/test', function ($provide) {

      $provide.value('authorization', {
        isUpdated: authUpdatedStub
      });

      $provide.value('authentication', {
      });

      $provide.value('enforcements', {
        getPeriodUsage: periodUsageStub,
        computeUsage: computeUsageStub,
        determineEnforcement: enforcementStub
      });

      $provide.value('reasonsDenied', sinon.stub());

      $provide.value('analytics', {
        track: trackStub
      });

      $provide.value('notification', {
        serverError: errorStub
      });
    });
    inject(function ($controller, $rootScope, cfStub){
      scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      spaceController = $controller('SpaceCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('watches for new locales', function () {
    var publishStub, refreshStub;
    beforeEach(function () {
      publishStub = sinon.stub();
      refreshStub = sinon.stub();
      scope.spaceContext.space.getPublishLocales = publishStub;
      scope.spaceContext.refreshLocales = refreshStub;
    });

    it('refreshes locales if new locales are available', function () {
      publishStub.returns([
        {code: 'en-US'},
        {code: 'pt-PT'}
      ]);
      scope.$digest();
      expect(refreshStub.called).toBeTruthy();
    });

    it('does not refresh locales if no new locales are available', function () {
      scope.spaceContext.space = null;
      scope.$digest();
      expect(refreshStub.called).toBeFalsy();
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
      expect(refreshStub.called).toBeTruthy();
    });
  });

  describe('refreshes content types if spaceContext changes', function () {
    var refreshStub;
    beforeEach(function () {
      scope.$digest();
      refreshStub = sinon.stub();
      scope.spaceContext = {
        refreshContentTypes: refreshStub
      };
      scope.$digest();
    });

    it('calls refresh method', function () {
      expect(refreshStub.called).toBeTruthy();
    });
  });

  describe('watches for updated tokenLookup', function () {
    var broadcastStub;
    beforeEach(inject(function (authentication, $rootScope) {
      authentication.tokenLookup = {};
      authUpdatedStub.returns(true);
      periodUsageStub.returns(true);
      broadcastStub = sinon.stub($rootScope, '$broadcast');
      scope.$digest();
    }));

    afterEach(function () {
      broadcastStub.restore();
    });

    it('gets period usage', function () {
      expect(periodUsageStub.called).toBeTruthy();
    });

    it('broadcasts event if usage exceeded', function () {
      expect(broadcastStub.called).toBeTruthy();
    });
  });

  describe('can method for permissions', function () {
    var broadcastStub;
    var canStub;
    var result, args;
    beforeEach(inject(function (authorization, $rootScope) {
      args = [1, 2];
      canStub = sinon.stub();
      authorization.spaceContext = {
        can: canStub
      };
      broadcastStub = sinon.stub($rootScope, '$broadcast');
    }));

    afterEach(function () {
      broadcastStub.restore();
    });

    describe('if there is no space context', function () {
      beforeEach(inject(function (authorization) {
        authorization.spaceContext = null;
      }));

      it('can is not called', function () {
        expect(canStub.called).toBeFalsy();
      });

      it('enforcement is not determined', function () {
        expect(enforcementStub.called).toBeFalsy();
      });

      it('event is not broadcast', function () {
        expect(broadcastStub.called).toBeFalsy();
      });

      it('response is returned', function () {
        expect(result).toBeFalsy();
      });
    });

    describe('if permission succeeds', function () {
      beforeEach(function () {
        canStub.returns(true);
      });

      describe('if there are reasons', function () {
        beforeEach(function () {
          result = scope.can(args);
        });

        it('can is called', function () {
          expect(canStub.calledWith(args)).toBeTruthy();
        });

        it('enforcement is not determined', function () {
          expect(enforcementStub.called).toBeFalsy();
        });

        it('event is not broadcast', function () {
          expect(broadcastStub.called).toBeFalsy();
        });

        it('response is returned', function () {
          expect(result).toBeTruthy();
        });
      });
    });

    describe('if permission fails', function () {
      beforeEach(function () {
        canStub.returns(false);
      });

      describe('if there are reasons', function () {
        beforeEach(function () {
          enforcementStub.returns({});
          result = scope.can(args);
        });

        it('can is called', function () {
          expect(canStub.calledWith(args)).toBeTruthy();
        });

        it('enforcement is determined', function () {
          expect(enforcementStub.called).toBeTruthy();
        });

        it('event is broadcast', function () {
          expect(broadcastStub.called).toBeTruthy();
        });

        it('response is returned', function () {
          expect(result).toBeFalsy();
        });
      });

      describe('if there are no reasons', function () {
        beforeEach(function () {
          enforcementStub.returns(false);
          result = scope.can(args);
        });

        it('can is called', function () {
          expect(canStub.calledWith(args)).toBeTruthy();
        });

        it('enforcement is determined', function () {
          expect(enforcementStub.called).toBeTruthy();
        });

        it('event is not broadcast', function () {
          expect(broadcastStub.called).toBeFalsy();
        });

        it('response is returned', function () {
          expect(result).toBeFalsy();
        });
      });
    });
  });

  it('analytics event fired on logo clicked', function () {
    scope.logoClicked();
    expect(trackStub.called).toBeTruthy();
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
      expect(broadcastStub.called).toBeTruthy();
    });
  });

  describe('creates an entry', function () {
    var createStub;
    var contentType;
    beforeEach(inject(function (cfStub) {
      createStub = sinon.stub(scope.spaceContext.space, 'createEntry');
      contentType = cfStub.contentType(scope.spaceContext.space, 'thing', 'Thing');
    }));

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      scope.createEntry(contentType);
      expect(createStub.called).toBeTruthy();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.callsArgWith(2, {
          body: {
            details: {
              reasons: []
            }
          }
        });
        scope.createEntry(contentType);
      });

      it('determines enforcements', function () {
        expect(enforcementStub.calledWith([], 'entry')).toBeTruthy();
      });

      it('notifies of the error', function () {
        expect(errorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
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
        createStub.callsArgWith(2, null, {});
        scope.createEntry(contentType);
      });

      it('navigates to editor', function () {
        expect(editorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
      });
    });
  });

  describe('creates an asset', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(scope.spaceContext.space, 'createAsset');
    });

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      scope.createAsset();
      expect(createStub.called).toBeTruthy();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.callsArgWith(1, {
          body: {
            details: {
              reasons: []
            }
          }
        });
        scope.createAsset();
      });

      it('determines enforcements', function () {
        expect(enforcementStub.calledWith([], 'asset')).toBeTruthy();
      });

      it('notifies of the error', function () {
        expect(errorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
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
        createStub.callsArgWith(1, null, cfStub.asset(scope.spaceContext.space, 'image'));
        scope.createAsset();
      }));

      it('navigates to editor', function () {
        expect(editorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
      });
    });
  });

  describe('creates a content type', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(scope.spaceContext.space, 'createContentType');
    });

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      scope.createContentType();
      expect(createStub.called).toBeTruthy();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.callsArgWith(1, {
          body: {
            details: {
              reasons: []
            }
          }
        });
        scope.createContentType();
      });

      it('determines enforcements', function () {
        expect(enforcementStub.calledWith([], 'contentType')).toBeTruthy();
      });

      it('notifies of the error', function () {
        expect(errorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
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
        createStub.callsArgWith(1, null, {});
        scope.createContentType();
      });

      it('navigates to editor', function () {
        expect(editorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
      });
    });
  });

  describe('creates an api key', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(scope.spaceContext.space, 'createBlankApiKey');
    });

    afterEach(function () {
      createStub.restore();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        computeUsageStub.returns({});
        scope.createApiKey();
      });

      it('computes the api key usage', function () {
        expect(computeUsageStub.calledWith('apiKey')).toBeTruthy();
      });

      it('notifies of the error', function () {
        expect(errorStub.called).toBeTruthy();
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
        computeUsageStub.returns(null);
        scope.createApiKey();
      });

      it('computes the api key usage', function () {
        expect(computeUsageStub.calledWith('apiKey')).toBeTruthy();
      });

      it('calls the space create method', function () {
        expect(createStub.called).toBeTruthy();
      });

      it('navigates to editor', function () {
        expect(editorStub.called).toBeTruthy();
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
      });
    });
  });


});
