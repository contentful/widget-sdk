'use strict';

describe('Trial Watch controller', function () {
  var scope;
  var trialWatchCtrl;
  var ownerStub;
  var broadcastStub;
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
      broadcastStub = sinon.stub($rootScope, '$broadcast');

      $window = _$window_;
      $q = _$q_;

      ownerStub = sinon.stub();

      trialWatchCtrl = $controller('TrialWatchController', {
        $scope: scope
      });
    });
  });

  afterEach(inject(function ($log) {
    broadcastStub.restore();
    $log.assertEmpty();
  }));


  it('gets no persistent notification', function () {
    scope.user = null;
    scope.spaceContext = {
      space: null
    };
    scope.$digest();
    expect(broadcastStub).not.toBeCalled();
  });

  describe('removes an existing notification', function () {
    beforeEach(function () {
      scope.user = {};
      scope.spaceContext = {
        space: makeSpace({})
      };
      scope.$digest();
    });

    it('calls broadcast', function () {
      expect(broadcastStub).toBeCalled();
    });

    it('calls broadcast with null', function () {
      expect(broadcastStub.args[0][1]).toBeNull();
    });
  });

  describe('shows a persistent notification', function () {
    var momentStub, diffStub;

    beforeEach(function () {
      jasmine.clock().install();
      momentStub = sinon.stub($window, 'moment');
      diffStub = sinon.stub();
      momentStub.returns({
        diff: diffStub
      });
    });

    afterEach(function () {
      momentStub.restore();
      jasmine.clock().uninstall();
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
      });

      describe('for hours periods', function () {
        beforeEach(function () {
          diffStub.returns(20);
          scope.$digest();
        });

        it('shows a message', function () {
          expect(broadcastStub.args[0][1].message).toMatch(/20(.*)hours left in trial/);
        });

        it('shows a tooltip message for trial mode', function () {
          expect(broadcastStub.args[0][1].tooltipMessage).toMatch('trial mode');
        });

        it('shows a tooltip message for hours', function () {
          expect(broadcastStub.args[0][1].tooltipMessage).toMatch('20 more hours');
        });

        it('shows an action message', function () {
          expect(broadcastStub.args[0][1].actionMessage).toMatch(/upgrade/i);
        });

        it('has an action', function () {
          expect(typeof broadcastStub.args[0][1].action).toBe('function');
        });
      });

      describe('for days periods', function () {
        beforeEach(function () {
          diffStub.returns(76);
          scope.user = {sys: {}};
          scope.$digest();
        });

        it('shows a tooltip message for trial mode', function () {
          expect(broadcastStub.args[0][1].tooltipMessage).toMatch('trial mode');
        });

        it('shows a tooltip message for days', function () {
          expect(broadcastStub.args[0][1].tooltipMessage).toMatch('3 more days');
        });

        it('shows an action message', function () {
          expect(broadcastStub.args[0][1].actionMessage).toMatch(/upgrade/i);
        });

        it('has an action', function () {
          expect(typeof broadcastStub.args[0][1].action).toBe('function');
        });
      });

      describe('no action', function () {
        beforeEach(function () {
          ownerStub.returns(false);
          scope.user = {};
          scope.$digest();
        });

        it('does not show an action message', function () {
          expect(broadcastStub.args[0][1].actionMessage).toBeUndefined();
        });

        it('does not have an action', function () {
          expect(broadcastStub.args[0][1].action).toBeUndefined();
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
      });

      describe('with an action', function () {
        beforeEach(function () {
          ownerStub.returns(true);
          scope.$digest();
        });

        it('shows a message', function () {
          expect(broadcastStub.args[0][1].message).toMatch('free version');
        });

        it('shows a tooltip message', function () {
          expect(broadcastStub.args[0][1].tooltipMessage).toMatch('free plan');
        });

        it('shows an action message', function () {
          expect(broadcastStub.args[0][1].actionMessage).toMatch(/upgrade/i);
        });

        it('has an action', function () {
          expect(typeof broadcastStub.args[0][1].action).toBe('function');
        });
      });

      describe('no action', function () {
        beforeEach(function () {
          ownerStub.returns(false);
          scope.user = {};
          scope.$digest();
        });

        it('does not show an action message', function () {
          expect(broadcastStub.args[0][1].actionMessage).toBeUndefined();
        });

        it('does not have an action', function () {
          expect(broadcastStub.args[0][1].action).toBeUndefined();
        });
      });
    });
  });

});
