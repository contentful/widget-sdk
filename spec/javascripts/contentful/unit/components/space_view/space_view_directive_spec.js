'use strict';

describe('The Space view directive', function () {

  var container, scope;
  var canStub, reasonsStub, sectionStub, viewTypeStub;
  var compileElement;

  beforeEach(function () {
    reasonsStub = sinon.stub();
    sectionStub = sinon.stub();
    viewTypeStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('authorization', {
        isUpdated: sinon.stub(),
        spaceContext: {}
      });
      $provide.value('reasonsDenied', reasonsStub);
      $provide.value('environment', {
        settings: {
          filepicker: {
            api_key: 'apikey'
          }
        }
      });
      $provide.factory('otDocForDirective', function () { return {}; });
      $provide.factory('otDocPresenceDirective', function () { return {}; });
      $provide.factory('entryEditorDirective', function () { return {}; });
      $provide.factory('apiKeyEditorDirective', function () { return {}; });
      $provide.factory('entryListDirective', function () { return {}; });
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {
          getPublishLocales: sinon.stub()
        },
        refreshContentTypes: sinon.stub(),
        refreshLocales: sinon.stub(),
        tabList: {
          currentSection: sectionStub,
          currentViewType: viewTypeStub
        }
      };
      canStub = sinon.stub();

      compileElement = function () {
        container = $('<space-view></space-view>');
        $compile(container)(scope);
        scope.can = canStub;
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  it('main navigation shown if space is defined', function () {
    compileElement();
    expect(container.find('.nav-bar > ul').hasClass('ng-hide')).toBeFalsy();
  });

  it('main navigation not shown if space is defined', function () {
    delete scope.spaceContext.space;
    compileElement();
    expect(container.find('.nav-bar > ul').hasClass('ng-hide')).toBeTruthy();
  });

  it('add button always shown even if no create permissions exist', function () {
    canStub.returns(false);
    compileElement();
    expect(container.find('.add-dropdown-button').hasClass('ng-hide')).toBe(false);
  });

  function makeShownButtonTest(type) {
    describe('if user can create a '+type, function () {
      var addDropdownButton;
      beforeEach(function () {
        canStub.withArgs('create', type).returns(true);
        compileElement();
        addDropdownButton = container.find('.add-dropdown-button');
      });

      it('show add button', function () {
        expect(addDropdownButton.hasClass('ng-hide')).toBeFalsy();
      });

    });
  }

  makeShownButtonTest('ContentType');
  makeShownButtonTest('Entry');
  makeShownButtonTest('Asset');
  makeShownButtonTest('ApiKey');


  function makeNavbarItemTest(type, action, viewType){
    describe('navbar item for '+type, function () {
      var selector = 'li[data-view-type="'+viewType+'"]';

      it('is hidden', function () {
        canStub.withArgs(action, type).returns(false);
        compileElement();
        expect(container.find(selector).hasClass('ng-hide')).toBe(true);
      });

      it('is shown', function () {
        canStub.withArgs(action, type).returns(true);
        compileElement();
        expect(container.find(selector).hasClass('ng-hide')).toBe(false);
      });
    });
  }

  makeNavbarItemTest('ApiKey', 'read', 'api-key-list');
  makeNavbarItemTest('ContentType', 'read', 'content-type-list');
  makeNavbarItemTest('Settings', 'update', 'space-settings');

  function makeNavbarItemClassesTest(dataViewType, viewType, section) {
    describe('defines classes on '+dataViewType+' for highlighted navigation', function () {
      var selector = 'li[data-view-type="'+dataViewType+'"]';
      beforeEach(function () {
        sectionStub.returns(section);
        viewTypeStub.returns(viewType);
        compileElement();
      });

      it('defines section class', function () {
        expect(container.find(selector).hasClass('section')).toBeTruthy();
      });

      it('defines section-index class', function () {
        expect(container.find(selector).hasClass('section-index')).toBeTruthy();
      });
    });
  }

  makeNavbarItemClassesTest('content-type-list', 'content-type-list', 'contentTypes');
  makeNavbarItemClassesTest('entry-list', 'entry-list', 'entries');
  makeNavbarItemClassesTest('asset-list', 'asset-list', 'assets');
  makeNavbarItemClassesTest('api-key-list', 'api-key-list', 'apiKeys');
  makeNavbarItemClassesTest('space-settings', 'spaceSettings', 'spaceSettings');

  it('tab list shown if space is defined', function () {
    compileElement();
    expect(container.find('.tab-list').hasClass('ng-hide')).toBeFalsy();
  });

  it('tab list not shown if space is defined', function () {
    delete scope.spaceContext.space;
    compileElement();
    expect(container.find('.tab-list').hasClass('ng-hide')).toBeTruthy();
  });

  it('tab list has hidden class ', function () {
    scope.hideTabBar = sinon.stub();
    scope.hideTabBar.returns(true);
    compileElement();
    expect(container.find('.tab-list').hasClass('hidden')).toBeTruthy();
  });

  describe('rendering tab lists', function () {
    var activeStub, inactiveStub, canCloseStub, cannotCloseStub;
    beforeEach(function () {
      activeStub = sinon.stub();
      activeStub.returns(true);
      inactiveStub = sinon.stub();
      inactiveStub.returns(false);
      canCloseStub = sinon.stub();
      canCloseStub.returns(true);
      cannotCloseStub = sinon.stub();
      cannotCloseStub.returns(false);
      scope.spaceContext.tabList.items = [
        {active: activeStub, canClose: canCloseStub, dirty: true, hidden: false, viewType: 'entry-editor'},
        {active: inactiveStub, canClose: canCloseStub, dirty: true, hidden: false, viewType: 'api-key-editor'},
        {active: inactiveStub, canClose: cannotCloseStub, dirty: false, hidden: true, viewType: 'entry-list'}
      ];
      compileElement();
    });

    it('has 3 tabs', function () {
      expect(container.find('.tab-list li.tab').length).toBe(3);
    });

    it('first tab is active', function () {
      expect(container.find('.tab-list li.tab').eq(0).hasClass('active')).toBeTruthy();
    });

    it('second tab is inactive', function () {
      expect(container.find('.tab-list li.tab').eq(1).hasClass('active')).toBeFalsy();
    });

    it('third tab is inactive', function () {
      expect(container.find('.tab-list li.tab').eq(2).hasClass('active')).toBeFalsy();
    });

    it('first tab is dirty', function () {
      expect(container.find('.tab-list li.tab').eq(0).hasClass('dirty')).toBeTruthy();
    });

    it('second tab is dirty', function () {
      expect(container.find('.tab-list li.tab').eq(1).hasClass('dirty')).toBeTruthy();
    });

    it('third tab is not dirty', function () {
      expect(container.find('.tab-list li.tab').eq(2).hasClass('dirty')).toBeFalsy();
    });

    it('first tab is shown', function () {
      expect(container.find('.tab-list li.tab').eq(0).hasClass('ng-hide')).toBeFalsy();
    });

    it('second tab is shown', function () {
      expect(container.find('.tab-list li.tab').eq(1).hasClass('ng-hide')).toBeFalsy();
    });

    it('third tab is not shown', function () {
      expect(container.find('.tab-list li.tab').eq(2).hasClass('ng-hide')).toBeTruthy();
    });

    it('first tab can be closed', function () {
      expect(container.find('.tab-list li.tab .close').eq(0).hasClass('ng-hide')).toBeFalsy();
    });

    it('second tab can be closed', function () {
      expect(container.find('.tab-list li.tab .close').eq(1).hasClass('ng-hide')).toBeFalsy();
    });

    it('third tab cannot be closed', function () {
      expect(container.find('.tab-list li.tab .close').eq(2).hasClass('ng-hide')).toBeTruthy();
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
      expect(container.find('.tab-content .entry-editor').parent().hasClass('ng-hide')).toBeFalsy();
    });

    it('api key editor is not shown', function () {
      expect(container.find('.tab-content .api-key-editor').parent().hasClass('ng-hide')).toBeTruthy();
    });

    it('entry list is not shown', function () {
      expect(container.find('.tab-content .entry-list').parent().hasClass('ng-hide')).toBeTruthy();
    });

  });

});
