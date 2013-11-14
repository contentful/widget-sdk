'use strict';

describe('Client controller', function () {
  var scope;
  var clientCtrl;
  var ownerStub;
  var $window, $q;

  function makeSpace(subscription) {
    return {
      data: {
        subscription: subscription
      },
      isOwner: ownerStub
    };
  }

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, _$window_, _$q_) {
      scope = $rootScope.$new();
      $window = _$window_;
      $q = _$q_;

      ownerStub = sinon.stub();

      clientCtrl = $controller('ClientCtrl', {
        $scope: scope
      });
    });
  });

  it('gets no persistent notification', function () {
    scope.user = null;
    scope.spaceContext = {
      space: null
    };
    scope.$digest();
    expect(scope.persistentNotification).toBeUndefined();
  });

  it('removes an existing notification', function () {
    scope.user = {};
    scope.spaceContext = {
      space: makeSpace({})
    };
    scope.persistentNotification = {};
    scope.$digest();
    expect(scope.persistentNotification).toBeUndefined();
  });

  describe('shows a persistent notification', function () {
    var momentStub, diffStub;

    beforeEach(function () {
      jasmine.Clock.useMock();
      momentStub = sinon.stub($window, 'moment');
      diffStub = sinon.stub();
      momentStub.returns({
        diff: diffStub
      });
    });

    afterEach(function () {
      momentStub.restore();
    });

    describe('for a trial subscription', function () {
      beforeEach(function(){
        scope.user = {};
        scope.spaceContext = {
          space: makeSpace({
            state: 'trial',
            trialPeriodEndsAt: '2013-12-13T13:28:44Z'
          })
        };
        ownerStub.returns(true);
        diffStub.returns(20);

        scope.$digest();
      });

      it('shows a message', function () {
        expect(scope.persistentNotification.message).toBe('Trial version');
      });

      it('shows a tooltip message', function () {
        expect(scope.persistentNotification.tooltipMessage).toBe('This Space has 20 hours left.');
      });

      it('shows a tooltip message for days', function () {
        diffStub.returns(76);
        scope.user = {};
        scope.$apply();
        jasmine.Clock.tick(500);
        expect(scope.persistentNotification.tooltipMessage).toBe('This Space has 3 days left.');
      });

      it('shows an action message', function () {
        expect(scope.persistentNotification.actionMessage).toBe('Upgrade');
      });

      it('has an action', function () {
        expect(typeof scope.persistentNotification.action).toBe('function');
      });

      describe('no action', function () {
        beforeEach(function () {
          ownerStub.returns(false);
          scope.user = {};
          scope.$apply();
          jasmine.Clock.tick(500);
        });

        it('does not show an action message', function () {
          expect(scope.persistentNotification.actionMessage).toBeUndefined();
        });

        it('does not have an action', function () {
          expect(scope.persistentNotification.action).toBeUndefined();
        });
      });

    });

    describe('for a free subscription', function () {
      beforeEach(function(){
        scope.user = {};
        scope.spaceContext = {
          space: makeSpace({
            state: 'active',
            subscriptionPlan: {
              paid: false,
              kind: 'default'
            }
          })
        };
        ownerStub.returns(true);

        scope.$digest();
      });

      it('shows a message', function () {
        expect(scope.persistentNotification.message).toBe('Paid plans');
      });

      it('shows a tooltip message', function () {
        scope.user = {};
        scope.$apply();
        jasmine.Clock.tick(500);
        expect(scope.persistentNotification.tooltipMessage).toBe('Upgrade to a paid plan to activate all features.');
      });

      it('shows an action message', function () {
        expect(scope.persistentNotification.actionMessage).toBe('Upgrade');
      });

      it('has an action', function () {
        expect(typeof scope.persistentNotification.action).toBe('function');
      });

      describe('no action', function () {
        beforeEach(function () {
          ownerStub.returns(false);
          scope.user = {};
          scope.$apply();
          jasmine.Clock.tick(500);
        });

        it('does not show an action message', function () {
          expect(scope.persistentNotification.actionMessage).toBeUndefined();
        });

        it('does not have an action', function () {
          expect(scope.persistentNotification.action).toBeUndefined();
        });
      });
    });
  });

});
