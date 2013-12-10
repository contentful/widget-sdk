'use strict';

describe('The Space view directive', function () {

  var container, scope;
  var canStub, reasonsStub;
  var compileElement;

  beforeEach(function () {
    reasonsStub = sinon.stub();
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
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {
          getPublishLocales: sinon.stub()
        },
        refreshContentTypes: sinon.stub(),
        refreshLocales: sinon.stub()
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


  it('add button always shown even if no create permissions exist', function () {
    canStub.returns(false);
    compileElement();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(false);
  });


  function makeShownButtonTest(type, itemClass) {
    var menuItems = [
      'add-content-type',
      'content-types',
      'add-asset',
      'add-api-key'
    ];
    describe('if user can create a '+type, function () {
      var tablistButton;
      beforeEach(function () {
        canStub.withArgs('create', type).returns(true);
        compileElement();
        tablistButton = container.find('.tablist-button');
      });

      it('show add button', function () {
        expect(tablistButton.hasClass('ng-hide')).toBeFalsy();
      });

      it('add menu item with class '+itemClass+' is not hidden', function () {
        expect(tablistButton.find('.'+itemClass).hasClass('ng-hide')).toBeFalsy();
      });

      it('separator only shows for Entry', function () {
        if(type == 'Entry'){
          expect(tablistButton.find('.separator').hasClass('ng-hide')).toBeFalsy();
        } else {
          expect(tablistButton.find('.separator').hasClass('ng-hide')).toBeTruthy();
        }
      });

      var currentItem = menuItems.indexOf(itemClass);
      menuItems.splice(currentItem, 1);
      menuItems.forEach(function (val) {
        it(val+' add menu item is hidden', function () {
          expect(tablistButton.find('.'+val).hasClass('ng-hide')).toBeTruthy();
        });
      });

    });

  }
  makeShownButtonTest('ContentType', 'add-content-type');
  makeShownButtonTest('Entry', 'content-types');
  makeShownButtonTest('Asset', 'add-asset');
  makeShownButtonTest('ApiKey', 'add-api-key');


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
});
