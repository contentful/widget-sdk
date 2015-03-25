'use strict';

describe('Space view directive', function () {

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
      $provide.removeDirectives('otDocFor', 'otDocPresence', 'entryEditor', 'apiKeyEditor', 'entryList', 'cfTabList', 'cfTabContent');
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
        get: sinon.stub()
      };
      scope.permissionController.get.returns(false);

      scope.spaces = [{}];
      scope.locationInAccount = false;

      compileElement = function () {
        container = $('<space-view></space-view>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  it('main navigation not shown if space is defined but hibernated', function () {
    stubs.isHibernated.returns(true);
    compileElement();
    expect(container.find('[ui-view="space-nav-bar"]')[0].children.length).toEqual(0);
  });

  /** FIXME: Some of these tests are disabled because they don't make sense with the new routing */
  xit('add button not shown even if no create permissions exist', function () {
    scope.permissionController.get.withArgs('createContentType', 'shouldHide').returns(true);
    scope.permissionController.get.withArgs('createEntry', 'shouldHide').returns(true);
    scope.permissionController.get.withArgs('createAsset', 'shouldHide').returns(true);
    scope.permissionController.get.withArgs('createApiKey', 'shouldHide').returns(true);
    compileElement();
    expect(container.find('.add-dropdown')).toBeNgHidden();
  });

  function makeShownButtonTest(type) {
    xdescribe('if user can create a '+type, function () {
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
    xdescribe('navbar item for '+type, function () {
      var selector = 'li[data-view-type="'+viewType+'"]';

      it('is hidden', function () {
        scope.permissionController.get.withArgs(action+type, 'shouldHide').returns(true);
        compileElement();
        expect(container.find(selector)).toBeNgHidden();
      });

      it('is shown', function () {
        scope.permissionController.get.withArgs(action+type, 'shouldHide').returns(false);
        compileElement();
        expect(container.find(selector)).not.toBeNgHidden();
      });
    });
  }

  makeNavbarItemTest('ApiKey', 'read', 'api-home');
  makeNavbarItemTest('ContentType', 'update', 'content-type-list');
  makeNavbarItemTest('Settings', 'update', 'space-settings');

  function makeNavbarItemClassesTest(dataViewType, viewType, section) {
    xdescribe('defines classes on '+dataViewType+' for highlighted navigation', function () {
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
});
