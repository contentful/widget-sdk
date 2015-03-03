'use strict';

describe('Space Controller', function () {
  var spaceController, scope, stubs, $q, logger;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'authUpdated',
        'periodUsage',
        'setSpaceContext',
        'track',
        'localesStub'
      ]);

      $provide.value('authorization', {
        isUpdated: stubs.authUpdated
      });

      $provide.value('authentication', {
      });

      $provide.value('enforcements', {
        getPeriodUsage: stubs.periodUsage,
        setSpaceContext: stubs.setSpaceContext
      });

      $provide.value('analytics', {
        track: stubs.track
      });
    });
    inject(function ($controller, $rootScope, cfStub, $injector){
      $q = $injector.get('$q');
      logger = $injector.get('logger');
      scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      spaceController = $controller('SpaceController', {$scope: scope});
    });
  });

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
      sinon.assert.notCalled(refreshStub);
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

});
