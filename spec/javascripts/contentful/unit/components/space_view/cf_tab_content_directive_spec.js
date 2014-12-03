'use strict';

describe('cfTabContent directive', function () {

  var container, scope, stubs;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'viewType', 'isHibernated'
      ]);
      $provide.removeDirectives(
        'otDocFor', 'otDocPresence',
        'entryList', 'entryEditor',
        'apiKeyList', 'apiKeyEditor',
        'assetList', 'assetEditor', 'apiHome',
        'contentTypeList', 'contentTypeEditor',
        'contentModel','editingInterfaceEditor', 'spaceSettings'
      );
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {
           isHibernated: stubs.isHibernated
        },
        tabList: {
          currentViewType: stubs.viewType
        }
      };

      scope.spaces = [{}];
      scope.locationInAccount = false;

      compileElement = function () {
        container = $('<div><div cf-tab-content></div></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  describe('rendering tab lists', function () {
    var activeStub, inactiveStub;
    beforeEach(function () {
      activeStub = sinon.stub();
      activeStub.returns(true);
      inactiveStub = sinon.stub();
      inactiveStub.returns(false);
      scope.spaceContext.tabList.items = [
        {active: activeStub, dirty: true, hidden: false, viewType: 'entry-editor'},
        {active: inactiveStub, dirty: true, hidden: false, viewType: 'api-key-editor'},
        {active: inactiveStub, dirty: false, hidden: true, viewType: 'entry-list'}
      ];
      compileElement();
    });

    it('tab content shown if space is defined and tab active', function () {
      compileElement();
      expect(container.find('.tab-content').eq(0)).not.toBeNgHidden();
    });

    it('main navigation not shown if space is not defined', function () {
      delete scope.spaceContext.space;
      compileElement();
      expect(container.find('.tab-content').eq(0)).toBeNgHidden();
    });

    it('tab content not shown if space is defined but hibernated', function () {
      stubs.isHibernated.returns(true);
      compileElement();
      expect(container.find('.tab-content').eq(0)).toBeNgHidden();
    });

    it('has 3 tabs with content', function () {
      expect(container.find('.tab-content').length).toBe(3);
    });

    it('has entry editor', function () {
      expect(container.find('.tab-content .entry-editor').get(0)).toBeDefined();
    });

    it('has api key editor', function () {
      expect(container.find('.tab-content .api-key-editor').get(0)).toBeDefined();
    });

    it('has entry list', function () {
      expect(container.find('.tab-content .entry-list').get(0)).toBeDefined();
    });

    it('entry editor is shown', function () {
      expect(container.find('.tab-content .entry-editor').parent()).not.toBeNgHidden();
    });

    it('api key editor is not shown', function () {
      expect(container.find('.tab-content .api-key-editor').parent()).toBeNgHidden();
    });

    it('entry list is not shown', function () {
      expect(container.find('.tab-content .entry-list').parent()).toBeNgHidden();
    });

  });

});
