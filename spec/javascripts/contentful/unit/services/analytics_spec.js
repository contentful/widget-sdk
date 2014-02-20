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
        'createElement', 'getElementsByTagName', 'insertBefore',
        'getId', 'getName'
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

    describe('knowledge base', function() {
      beforeEach(function() {
        analytics.track = sinon.stub();
        analytics.knowledgeBase('section');
      });

      it('tracks link opening', function() {
        expect(analytics.track).toBeCalled();
      });

      it('sends data to track', function() {
        expect(analytics.track.args[0][1]).toEqual({
          section: 'section'
        });
      });
    });

    describe('modified content type', function() {
      var event, contentType, field;
      beforeEach(function() {
        analytics.track = sinon.stub();
        event = {event: true};
        contentType = {
          getId: stubs.getId,
          getName: stubs.getName
        };
        field = {
          id: 'id',
          name: 'name',
          type: 'Array',
          items: {type: 'Link'},
          localized: true,
          required: true
        };
        stubs.getId.returns('ctid');
        stubs.getName.returns('ctname');
        analytics.modifiedContentType(event, contentType, field, 'update');
      });

      it('tracks link opening', function() {
        expect(analytics.track).toBeCalled();
      });

      it('sends data to track', function() {
        expect(analytics.track.args[0][1]).toEqual({
          contentTypeId: 'ctid',
          contentTypeName: 'ctname',
          fieldId: 'id',
          fieldName: 'name',
          fieldType: 'Array',
          fieldSubtype: 'Link',
          fieldLocalized: true,
          fieldRequired: true,
          action: 'update'
        });
      });
    });

    describe('tab closed', function() {
      var tab;
      beforeEach(function() {
        analytics.track = sinon.stub();
        analytics._idFromTab = sinon.stub();
        analytics._idFromTab.returns('id');
        tab = {
          viewType: 'viewtype',
          section: 'section',
          id: 'id'
        };
        analytics.tabClosed(tab);
      });

      it('tracks tab closing', function() {
        expect(analytics.track).toBeCalled();
      });

      it('sends data to tab closing track', function() {
        expect(analytics.track.args[0][1]).toEqual({
          viewType: 'viewtype',
          section: 'section',
          id: 'id'
        });
      });
    });

    describe('toggle aux panel', function() {
      var tab;
      beforeEach(function() {
        analytics.track = sinon.stub();
        tab = {
          viewType: 'viewtype',
          section: 'section'
        };
        analytics.toggleAuxPanel(true, tab);
      });

      it('tracks toggling', function() {
        expect(analytics.track).toBeCalled();
      });

      it('sends track action name', function() {
        expect(analytics.track.args[0][0]).toMatch(/open/i);
      });

      it('sends data to track', function() {
        expect(analytics.track.args[0][1]).toEqual({
          currentViewType: 'viewtype',
          currentSection: 'section'
        });
      });
    });

    describe('id from tab', function() {
      var tab;
      beforeEach(function() {
        tab = {
          params: {
            entry: {
              getId: stubs.getId
            },
            contentType: {
              getId: stubs.getId
            }
          }
        };
        stubs.getId.returns('id');
      });

      it('on entry editor', function() {
        tab.viewType = 'entry-editor';
        expect(analytics._idFromTab(tab)).toBe('id');
      });

      it('on content type editor', function() {
        tab.viewType = 'content-type-editor';
        expect(analytics._idFromTab(tab)).toBe('id');
      });
    });

    describe('tracks view', function() {
      var tab;
      beforeEach(function() {
        analytics.track = sinon.stub();
        tab = {
          section: 'section',
          params: {
            entry: {
              getId: stubs.getId
            },
            contentType: {
              getId: stubs.getId
            }
          }
        };
        stubs.getId.returns('id');
      });

      describe('for entry list', function() {
        beforeEach(function() {
          tab.viewType = 'entry-list';
          analytics._trackView(tab);
        });

        it('tracks view', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to view track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: tab.viewType,
            section: 'section'
          });
        });
      });

      describe('for content type list', function() {
        beforeEach(function() {
          tab.viewType = 'content-type-list';
          analytics._trackView(tab);
        });

        it('tracks view', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to view track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: tab.viewType,
            section: 'section'
          });
        });
      });

      describe('for entry editor', function() {
        beforeEach(function() {
          tab.viewType = 'entry-editor';
          analytics._trackView(tab);
        });

        it('tracks view', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to view track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: tab.viewType,
            section: 'section',
            entryId: 'id'
          });
        });
      });

      describe('for content type editor', function() {
        beforeEach(function() {
          tab.viewType = 'content-type-editor';
          analytics._trackView(tab);
        });

        it('tracks view', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to view track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: tab.viewType,
            section: 'section',
            entryId: 'id'
          });
        });
      });

      describe('for space settings', function() {
        beforeEach(function() {
          tab.viewType = 'space-settings';
          tab.params.pathSuffix = 'suffix';
          analytics._trackView(tab);
        });

        it('tracks view', function() {
          expect(analytics.track).toBeCalled();
        });

        it('sends data to view track', function() {
          expect(analytics.track.args[0][1]).toEqual({
            viewType: tab.viewType,
            pathSuffix: 'suffix'
          });
        });
      });

    });

    describe('track an analytics action', function() {
      beforeEach(function() {
        $window.analytics.track = sinon.stub();
      });

      describe('if analytics disabled', function() {
        beforeEach(function() {
          analytics._disabled = true;
          analytics.track();
        });

        it('does not track', function() {
          expect($window.analytics.track).not.toBeCalled();
        });
      });

      describe('if analytics enabled', function() {
        var data;
        beforeEach(function() {
          data = {data: true};
          analytics._disabled = false;
          analytics._spaceData = {
            space: 'name'
          };
          analytics.track('event', data);
        });

        it('track on analytics object is called', function() {
          expect($window.analytics.track).toBeCalledWith('event', {
            data: true,
            space: 'name'
          });
        });

      });
    });


  });

});
