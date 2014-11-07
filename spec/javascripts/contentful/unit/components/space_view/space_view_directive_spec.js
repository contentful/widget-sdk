'use strict';

describe('The Space view directive', function () {

  var container, scope, stubs;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'section', 'viewType', 'isHibernated'
      ]);
      $provide.value('authorization', {
        isUpdated: sinon.stub(),
        spaceContext: {}
      });
      $provide.value('environment', {
        settings: {
          filepicker: {
            api_key: 'apikey'
          }
        }
      });
      $provide.removeDirectives('otDocFor', 'otDocPresence', 'entryEditor', 'apiKeyEditor', 'entryList');
      $provide.removeControllers('UiConfigController', 'PermissionController');
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {
          getPrivateLocales: sinon.stub(),
          isHibernated: stubs.isHibernated
        },
        refreshActiveLocales: sinon.stub(),
        refreshContentTypes: sinon.stub(),
        refreshLocales: sinon.stub(),
        tabList: {
          currentSection: stubs.section,
          currentViewType: stubs.viewType
        }
      };

      scope.permissionController = {
        createContentType: { shouldHide: false},
        updateContentType: { shouldHide: false},
        createEntry: { shouldHide: false},
        readEntry: { shouldHide: false},
        createAsset: { shouldHide: false},
        readAsset: { shouldHide: false},
        createApiKey: { shouldHide: false},
        readApiKey: { shouldHide: false},
        updateSettings: { shouldHide: false}
      };

      scope.spaces = [{}];
      scope.locationInAccount = false;

      compileElement = function () {
        container = $('<space-view></space-view>');
        $compile(container)(scope);
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
    expect(container.find('.nav-bar > ul')).not.toBeNgHidden();
  });

  it('main navigation not shown if space is not defined', function () {
    delete scope.spaceContext.space;
    compileElement();
    expect(container.find('.nav-bar > ul')).toBeNgHidden();
  });

  it('main navigation not shown if spaces list is empty', function () {
    scope.spaces = [];
    compileElement();
    expect(container.find('.nav-bar > ul')).toBeNgHidden();
  });

  it('main navigation not shown if in account section', function () {
    scope.locationInAccount = true;
    compileElement();
    expect(container.find('.nav-bar > ul')).toBeNgHidden();
  });

  it('main navigation not shown if space is defined but hibernated', function () {
    stubs.isHibernated.returns(true);
    compileElement();
    expect(container.find('.nav-bar > ul')).toBeNgHidden();
  });

  it('add button not shown even if no create permissions exist', function () {
    scope.permissionController = {
      createContentType: { shouldHide: true},
      createEntry: { shouldHide: true},
      createAsset: { shouldHide: true},
      createApiKey: { shouldHide: true}
    };
    compileElement();
    expect(container.find('.add-dropdown-button')).toBeNgHidden();
  });

  function makeShownButtonTest(type) {
    describe('if user can create a '+type, function () {
      var addDropdownButton;
      beforeEach(function () {
        compileElement();
        addDropdownButton = container.find('.add-dropdown-button');
      });

      it('show add button', function () {
        expect(addDropdownButton).not.toBeNgHidden();
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
        scope.permissionController[action+type].shouldHide = true;
        compileElement();
        expect(container.find(selector)).toBeNgHidden();
      });

      it('is shown', function () {
        scope.permissionController[action+type].shouldHide = false;
        compileElement();
        expect(container.find(selector)).not.toBeNgHidden();
      });
    });
  }

  makeNavbarItemTest('ApiKey', 'read', 'api-home');
  makeNavbarItemTest('ContentType', 'update', 'content-type-list');
  makeNavbarItemTest('Settings', 'update', 'space-settings');

  function makeNavbarItemClassesTest(dataViewType, viewType, section) {
    describe('defines classes on '+dataViewType+' for highlighted navigation', function () {
      var selector = 'li[data-view-type="'+dataViewType+'"]';
      beforeEach(function () {
        stubs.section.returns(section);
        stubs.viewType.returns(viewType);
        compileElement();
      });

      it('defines section class', function () {
        expect(container.find(selector)).toHaveClass('section');
      });

      it('defines section-index class', function () {
        expect(container.find(selector)).toHaveClass('section-index');
      });
    });
  }

  makeNavbarItemClassesTest('content-type-list', 'content-type-list', 'contentTypes');
  makeNavbarItemClassesTest('entry-list', 'entry-list', 'entries');
  makeNavbarItemClassesTest('asset-list', 'asset-list', 'assets');
  makeNavbarItemClassesTest('api-home', 'api-home', 'apiHome');
  makeNavbarItemClassesTest('space-settings', 'spaceSettings', 'spaceSettings');

  it('tab list shown if space is defined', function () {
    compileElement();
    expect(container.find('.tab-list')).not.toBeNgHidden();
  });

  it('tab list not shown if space is defined', function () {
    delete scope.spaceContext.space;
    compileElement();
    expect(container.find('.tab-list')).toBeNgHidden();
  });

  it('tab list not shown if space is defined but hibernated', function () {
    stubs.isHibernated.returns(true);
    compileElement();
    expect(container.find('.tab-list')).toBeNgHidden();
  });

  it('tab list has hidden class ', function () {
    scope.hideTabBar = sinon.stub();
    scope.hideTabBar.returns(true);
    compileElement();
    expect(container.find('.tab-list')).toHaveClass('hidden');
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
      expect(container.find('.tab-list li.tab').eq(0)).toHaveClass('active');
    });

    it('second tab is inactive', function () {
      expect(container.find('.tab-list li.tab').eq(1)).not.toHaveClass('active');
    });

    it('third tab is inactive', function () {
      expect(container.find('.tab-list li.tab').eq(2)).not.toHaveClass('active');
    });

    it('first tab is dirty', function () {
      expect(container.find('.tab-list li.tab').eq(0)).toHaveClass('dirty');
    });

    it('second tab is dirty', function () {
      expect(container.find('.tab-list li.tab').eq(1)).toHaveClass('dirty');
    });

    it('third tab is not dirty', function () {
      expect(container.find('.tab-list li.tab').eq(2)).not.toHaveClass('dirty');
    });

    it('first tab is shown', function () {
      expect(container.find('.tab-list li.tab').eq(0)).not.toBeNgHidden();
    });

    it('second tab is shown', function () {
      expect(container.find('.tab-list li.tab').eq(1)).not.toBeNgHidden();
    });

    it('third tab is not shown', function () {
      expect(container.find('.tab-list li.tab').eq(2)).toBeNgHidden();
    });

    it('first tab can be closed', function () {
      expect(container.find('.tab-list li.tab .close').eq(0)).not.toBeNgHidden();
    });

    it('second tab can be closed', function () {
      expect(container.find('.tab-list li.tab .close').eq(1)).not.toBeNgHidden();
    });

    it('third tab cannot be closed', function () {
      expect(container.find('.tab-list li.tab .close').eq(2)).toBeNgHidden();
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
