'use strict';

describe('The Space view permissions', function () {

  var container, scope;
  var canStub;

  beforeEach(function () {
    jasmine.Clock.useMock();
    canStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('can', canStub);
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {}
      };

      container = $('<space-view></space-view>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(function () {
    container.remove();
  });

  it('add button not shown if no create permissions exist', function () {
    canStub.returns(false);
    scope.$apply();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(true);
  });

  function makeShownButtonTest(type, itemClass) {
    var menuItems = [
      'add-content-type',
      'content-types',
      'add-asset',
      'add-api-key'
    ];
    describe('if user can create a '+type, function () {
      beforeEach(function () {
        canStub.withArgs('create', type).returns(true);
        scope.changer = 'changer'+Math.random();
        scope.$apply();
        jasmine.Clock.tick(500);
      });

      it('show add button', function () {
        expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(false);
      });

      it('add menu item is not hidden', function () {
        expect(container.find('.tablist-button .'+itemClass).hasClass('ng-hide')).toBe(false);
      });

      it('separator only shows for Entry', function () {
        if(type == 'Entry'){
          expect(container.find('.tablist-button .separator').hasClass('ng-hide')).toBe(false);
        } else {
          expect(container.find('.tablist-button .separator').hasClass('ng-hide')).toBe(true);
        }
      });

      var currentItem = menuItems.indexOf(itemClass);
      menuItems.splice(currentItem, 1);
      menuItems.forEach(function (val) {
        it(val+' add menu item is hidden', function () {
          expect(container.find('.tablist-button .'+val).hasClass('ng-hide')).toBe(true);
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
        scope.$apply();
        expect(container.find(selector).hasClass('ng-hide')).toBe(true);
      });

      it('is shown', function () {
        canStub.withArgs(action, type).returns(true);
        scope.$apply();
        expect(container.find(selector).hasClass('ng-hide')).toBe(false);
      });
    });
  }

  makeNavbarItemTest('ApiKey', 'read', 'api-key-list');
  makeNavbarItemTest('ContentType', 'read', 'content-type-list');
  makeNavbarItemTest('Settings', 'update', 'space-settings');
});
