'use strict';

describe('Analytics service', function () {
  var analytics, analyticsProvider;
  var stubs, $window, $document;
  var loadAnalytics, scriptMock;

  beforeEach(function () {
    module('contentful/test', function ($provide, _analyticsProvider_) {
      analyticsProvider = _analyticsProvider_;

      stubs = $provide.makeStubs([
        'load', 'ready', 'push', 'get', 'resolve',
        'createElement', 'getElementsByTagName', 'insertBefore'
      ]);

      $provide.value('$window', {
        addEventListener: sinon.stub()
      });

      var doc = {
        createElement: stubs.createElement,
        getElementsByTagName: stubs.getElementsByTagName,
        location: {
          protocol: 'protocol'
        }
      };

      stubs.get.returns(doc);
      $provide.value('$document', {
        get: stubs.get
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

    it('creates 2 script elements', function() {
      expect(stubs.createElement).toBeCalledTwice();
    });

    it('inserts 2 script elements', function() {
      expect(stubs.getElementsByTagName).toBeCalledTwice();
    });

    it('initializes totango object', function() {
      expect($window.totango).toBeDefined();
    });

    it('initializes totango options object', function() {
      expect($window.totango_options).toBeDefined();
    });

    describe('readies analytics', function() {
      it('pushes method', function() {
        expect(stubs.push).toBeCalledOnce();
      });

      it('gets method name', function() {
        expect(stubs.push.args[0][0][0]).toBe('ready');
      });
    });

    describe('on totango load event', function() {
      beforeEach(function() {
        $window.totango.go = sinon.stub();
      });

      describe('if space and user data not ready', function() {
        beforeEach(inject(function($rootScope) {
          scriptMock.onload();
          $rootScope.$digest();
        }));

        it('does not call totango initialization method', function() {
          expect($window.totango.go).not.toBeCalled();
        });
      });

      describe('when space and user data are ready', function() {
        beforeEach(inject(function($rootScope) {
          analytics._userData = {sys:{id: '123'}};
          analytics._organizationData = {sys:{id: '456'}};
          scriptMock.onload();
          analytics._spaceDeferred.resolve();
          analytics._userDeferred.resolve();
          $rootScope.$digest();
        }));

        it('calls totango initialization method', function() {
          expect($window.totango.go).toBeCalled();
        });

        it('sets up totango username', function() {
          expect($window.totango_options.username).toEqual('123-456');
        });

        it('sets up account id', function() {
          expect($window.totango_options.account.id).toEqual('456');
        });

        it('sets up initial module', function() {
          expect($window.totango_options.module).toEqual('Entries');
        });
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

    describe('sets space data', function() {
      var organization;

      beforeEach(function() {
        analytics._spaceDeferred = {
          resolve: stubs.resolve
        };
      });

      describe('to supplied data', function() {
        beforeEach(function() {
          organization = {
            sys: {id: '123'},
            subscriptionState: 'substate',
            invoiceState: 'invstate',
            subscriptionPlan: {
              sys: { id: '456' },
              name: 'name'
            }
          };
          analytics.setSpaceData({
            data: {
              tutorial: true,
              organization: organization
            }
          });
        });

        it('sets spaceData object', function() {
          expect(analytics._spaceData).toEqual({
            spaceIsTutorial: true,
            spaceSubscriptionKey: '123',
            spaceSubscriptionState: 'substate',
            spaceSubscriptionInvoiceState: 'invstate',
            spaceSubscriptionSubscriptionPlanKey: '456',
            spaceSubscriptionSubscriptionPlanName: 'name'
          });
        });

        it('sets organization data object', function() {
          expect(analytics._organizationData).toEqual(organization);
        });

        it('resolves deferred', function() {
          expect(stubs.resolve).toBeCalled();
        });
      });

      describe('to null', function() {
        beforeEach(function() {
          analytics.setSpaceData();
        });

        it('sets space data', function() {
          expect(analytics._spaceData).toBeNull();
        });

        it('sets organization data', function() {
          expect(analytics._organizationData).toBeNull();
        });

        it('resolves deferred', function() {
          expect(stubs.resolve).toBeCalled();
        });
      });
    });

    describe('sets user data', function() {
      var user;

      beforeEach(function() {
        analytics._userDeferred = {
          resolve: stubs.resolve
        };
      });

      describe('to supplied data', function() {
        beforeEach(function() {
          user = {name: 'Tiago'};
          analytics.setUserData(user);
        });

        it('sets userData object', function() {
          expect(analytics._userData).toEqual(user);
        });

        it('resolves deferred', function() {
          expect(stubs.resolve).toBeCalled();
        });
      });
    });

    describe('tab added', function() {
      var tab;
      beforeEach(function() {
        analytics.track = sinon.stub();
        analytics._trackView = sinon.stub();
        analytics._idFromTab = sinon.stub();
        analytics._idFromTab.returns('id');
        tab = {
          viewType: 'viewtype',
          section: 'section',
          id: 'id'
        };
        analytics.tabAdded(tab);
      });

      it('tracks tab opening', function() {
        expect(analytics.track).toBeCalled();
      });

      it('sends data to tab opening track', function() {
        expect(analytics.track.args[0][1]).toEqual({
          viewType: 'viewtype',
          section: 'section',
          id: 'id'
        });
      });

      it('tracks view', function() {
        expect(analytics._trackView).toBeCalledWith(tab);
      });
    });

    describe('tab activated', function() {
      var tab, oldTab;
      beforeEach(function() {
        analytics.track = sinon.stub();
        analytics._setTotangoModule = sinon.stub();
        analytics._idFromTab = sinon.stub();
        analytics._idFromTab.returns('id');
        tab = {
          viewType: 'viewtype',
          section: 'section',
          id: 'id'
        };
      });

      describe('without old tab', function() {
        beforeEach(function() {
          analytics.tabActivated(tab);
        });

        it('sets totango module', function() {
          expect(analytics._setTotangoModule).toBeCalledWith('section');
        });

        it('tracks tab opening', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to tab opening track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: 'viewtype',
            section: 'section',
            id: 'id',
            fromViewType: null,
            fromSection: null
          });
        });
      });

      describe('with old tab', function() {
        beforeEach(function() {
          oldTab = {
            viewType: 'oldviewtype',
            section: 'oldsection'
          };

          analytics.tabActivated(tab, oldTab);
        });

        it('sets totango module', function() {
          expect(analytics._setTotangoModule).toBeCalledWith('section');
        });

        it('tracks tab opening', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to tab opening track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: 'viewtype',
            section: 'section',
            id: 'id',
            fromViewType: 'oldviewtype',
            fromSection: 'oldsection'
          });
        });
      });
    });

    it('sets totango module', function() {
      $window.totango_options = {};
      analytics._setTotangoModule('entries');
      expect($window.totango_options.module).toBeDefined();
    });

  });

});
