'use strict';

describe('The add dropdown button directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('authorization', {
        isUpdated: sinon.stub(),
        spaceContext: {}
      });

      $provide.removeControllers('PermissionController');
    });
    inject(function ($rootScope, $compile, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('testSpace');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      scope.permissionController = {
        get: sinon.stub()
      };
      scope.permissionController.get.returns(false);

      compileElement = function () {
        container = $compile($('<div cf-add-dropdown-button class="add-dropdown" space-context="spaceContext"></div>'))(scope);
        scope.$digest();

      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  function makeShownButtonTest(type, itemClass) {
    var menuItems = [
      'add-content-type',
      'add-dropdown__content-types',
      'add-asset',
      'add-api-key'
    ];
    describe('if user can create a '+type, function () {
      beforeEach(function () {
        scope.permissionController.get.withArgs('createContentType', 'shouldHide').returns(true);
        scope.permissionController.get.withArgs('createEntry', 'shouldHide').returns(true);
        scope.permissionController.get.withArgs('createAsset', 'shouldHide').returns(true);
        scope.permissionController.get.withArgs('createApiKey', 'shouldHide').returns(true);
        scope.permissionController.get.withArgs('create'+type, 'shouldHide').returns(false);

        compileElement();
      });

      it('add menu item with class '+itemClass+' is not hidden', function () {
        expect(container.find('.'+itemClass)).not.toBeNgHidden();
      });

      it('separator only shows for Entry', function () {
        if(type == 'Entry'){
          expect(container.find('.separator')).not.toBeNgHidden();
        } else {
          expect(container.find('.separator')).toBeNgHidden();
        }
      });

      var currentItem = menuItems.indexOf(itemClass);
      menuItems.splice(currentItem, 1);
      menuItems.forEach(function (val) {
        it(val+' add menu item is hidden', function () {
          expect(container.find('.'+val)).toBeNgHidden();
        });
      });
    });
  }

  makeShownButtonTest('ContentType', 'add-content-type');
  makeShownButtonTest('Entry', 'add-dropdown__content-types');
  makeShownButtonTest('Asset', 'add-asset');
  makeShownButtonTest('ApiKey', 'add-api-key');

  describe('if a user can not create an Entry and no published content types exist', function () {
    beforeEach(function () {
      scope.permissionController.get.withArgs('createEntry', 'shouldHide').returns(true);
      scope.spaceContext.publishedContentTypes = [];
      compileElement();
    });

    it('add menu item with class content-types is hidden', function () {
      expect(container.find('.add-dropdown__content-types')).toBeNgHidden();
    });

    it('add menu item with class no-content-types is hidden', function () {
      expect(container.find('.add-dropdown__no-content-types')).toBeNgHidden();
    });
  });

  describe('if user can create an Entry but no published content types exist', function () {
    describe('and the user can not create Content Types', function () {
      beforeEach(function () {
        scope.spaceContext.publishedContentTypes = [];
        scope.permissionController.get.withArgs('createContentType', 'shouldHide').returns(true);
        compileElement();
      });

      it('add menu item with class content-types is hidden', function () {
        expect(container.find('.add-dropdown__content-types')).toBeNgHidden();
      });

      it('add menu item with class no-content-types is not hidden', function () {
        expect(container.find('.add-dropdown__no-content-types')).not.toBeNgHidden();
        expect(container.find('.add-dropdown__no-content-types li:not(.ng-hide)').text()).toMatch(/No Content Types available/);
      });
    });

    describe('and the user can create Content Types', function () {
      beforeEach(function () {
        scope.spaceContext.publishedContentTypes = [];
        compileElement();
      });

      it('add menu item with class content-types is hidden', function () {
        expect(container.find('.add-dropdown__content-types')).toBeNgHidden();
      });

      it('add menu item with class no-content-types is not hidden', function () {
        expect(container.find('.add-dropdown__no-content-types')).not.toBeNgHidden();
        expect(container.find('.add-dropdown__no-content-types li:not(.ng-hide)').text()).toMatch(/Create and activate/);
      });
    });


  });


});
