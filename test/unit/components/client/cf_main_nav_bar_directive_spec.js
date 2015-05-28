'use strict';

describe('Main nav bar directive', function () {

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
      $provide.removeDirectives('otDocFor', 'otDocPresence', 'entryEditor', 'apiKeyEditor', 'entryList', 'cfIcon');
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
        refreshLocales: sinon.stub()
      };

      scope.permissionController = {
        get: sinon.stub()
      };
      scope.permissionController.get.returns(false);

      scope.spaces = [{}];
      scope.locationInAccount = false;

      compileElement = function () {
        container = $('<cf-main-nav-bar></cf-main-nav-bar>');
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
    expect(container.find('.nav-bar__list')).toBeNgHidden();
  });

  function makeNavbarItemTest(type, action, viewType){
    describe('navbar item for '+type, function () {
      var selector = 'a[data-view-type="'+viewType+'"]';

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
});
