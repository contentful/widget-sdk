'use strict';

describe('Analytics service', function () {
  var analytics, analyticsProvider;
  var stubs, $window, $document;
  var loadAnalytics, scriptMock;

  beforeEach(function () {
    module('contentful/test', function ($provide, _analyticsProvider_) {
      analyticsProvider = _analyticsProvider_;

      stubs = $provide.makeStubs([
        'load', 'ready', 'push',
        'createElement', 'getElementsByTagName', 'insertBefore'
      ]);

      $provide.value('$window', {
        addEventListener: sinon.stub()
      });

      $provide.value('$document', {
        createElement: stubs.createElement,
        getElementsByTagName: stubs.getElementsByTagName,
        location: {
          protocol: 'protocol'
        }
      });

      scriptMock = {};
      stubs.createElement.returns(scriptMock);
      stubs.getElementsByTagName.returns([{
        parentNode: {
          insertBefore: stubs.insertBefore
        }
      }]);

    });

    inject(function (_$window_, _$document_) {
      $window = _$window_;
      $document = _$document_;
    });

    loadAnalytics = function () {
      inject(function (_analytics_) {
        analytics = _analytics_;
      });
    };

  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  var apiMethods = [
    'disable', 'login', 'setSpaceData', 'tabAdded', 'tabActivated',
    'knowledgeBase', 'modifiedContentType', 'tabClosed', 'toggleAuxPanel',
    '_idFromTab', '_trackView', 'track'
  ];

  describe('does not load analytics', function() {
    beforeEach(function() {
      analyticsProvider.dontLoad();
      loadAnalytics();
    });

    _.forEach(apiMethods, function (method) {
      it(method, function() {
        expect(analytics[method]).toBe(angular.noop);
      });
    });
  });

  describe('on production', function() {
    beforeEach(function() {
      $window.analytics = {};
      $window.analytics.ready = stubs.ready;
      $window.analytics.push = stubs.push;
      analyticsProvider.forceLoad();
      loadAnalytics();
    });

    it('creates a script element', function() {
      expect(stubs.createElement).toBeCalled();
    });

    it('inserts the script element', function() {
      expect(stubs.getElementsByTagName).toBeCalled();
    });

    describe('readies analytics', function() {
      it('pushes method', function() {
        expect(stubs.push).toBeCalledOnce();
      });

      it('gets method name', function() {
        expect(stubs.push.args[0][0][0]).toBe('ready');
      });
    });

    it('disables api', function() {
      analytics.disable();
      expect(analytics._disabled).toBeTruthy();
    });

    describe('tracks login', function() {
      beforeEach(function() {
        analytics.disable = sinon.stub();
        analytics.login({
          sys: {
            id: '123'
          },
          firstName: 'first',
          lastName: 'last',
          intercomUserHash: 'intercom',
          features: {
            logAnalytics: false
          }
        });
      });

      it('pushes method', function() {
        expect(stubs.push).toBeCalledTwice();
      });

      it('gets method name', function() {
        expect(stubs.push.args[1][0][0]).toBe('identify');
      });

      it('gets user id', function() {
        expect(stubs.push.args[1][0][1]).toBe('123');
      });

      it('gets user name object', function() {
        expect(stubs.push.args[1][0][2]).toEqual({
          firstName: 'first',
          lastName: 'last'
        });
      });

      it('gets intercom user hash', function() {
        expect(stubs.push.args[1][0][3]).toEqual({
          intercom: {
            user_hash: 'intercom'
          }
        });
      });

      it('disables analytics due to flag', function() {
        expect(analytics.disable).toBeCalled();
      });
    });

  });

  describe('sets space data', function() {
    it('to actual data', function() {
      analytics.setSpaceData({
        data: {
          tutorial: true,
          organization: {
            sys: {id: '123'},
            subscriptionState: 'substate',
            invoiceState: 'invstate',
            subscriptionPlan: {
              sys: { id: '456' },
              name: 'name'
            }
          }
        }
      });

      expect(analytics._spaceData).toEqual({
        spaceIsTutorial: true,
        spaceSubscriptionKey: '123',
        spaceSubscriptionState: 'substate',
        spaceSubscriptionInvoiceState: 'invstate',
        spaceSubscriptionSubscriptionPlanKey: '456',
        spaceSubscriptionSubscriptionPlanName: 'name'
      });
    });

    it('to null', function() {
      analytics.setSpaceData();
      expect(analytics._spaceData).toBeNull();
    });
  });

});
