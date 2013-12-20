'use strict';

describe('Space Controller', function () {
  var spaceController, scope;
  var authUpdatedStub, periodUsageStub, enforcementStub, trackStub;

  beforeEach(function () {
    authUpdatedStub = sinon.stub();
    periodUsageStub = sinon.stub();
    enforcementStub = sinon.stub();
    trackStub = sinon.stub();
    module('contentful/test', function ($provide) {

      $provide.value('authorization', {
        isUpdated: authUpdatedStub
      });

      $provide.value('authentication', {
      });

      $provide.value('enforcements', {
        getPeriodUsage: periodUsageStub,
        determineEnforcement: enforcementStub
      });

      $provide.value('reasonsDenied', sinon.stub());

      $provide.value('analytics', {
        track: trackStub
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

});
