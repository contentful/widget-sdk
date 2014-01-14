'use strict';

describe('The add dropdown button directive', function () {

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
    });
    inject(function ($rootScope, $compile, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('testSpace');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      canStub = sinon.stub();

      compileElement = function () {
        container = $compile($('<div class="add-dropdown-button" space-context="spaceContext"></div>'))(scope);
        scope.can = canStub;
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));


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
  makeShownButtonTest('Entry', 'content-types');
  makeShownButtonTest('Asset', 'add-asset');
  makeShownButtonTest('ApiKey', 'add-api-key');

  describe('if user can create an Entry but no published content types exist', function () {
    beforeEach(function () {
      canStub.withArgs('create', 'Entry').returns(true);
      scope.spaceContext.publishedContentTypes = [];
      compileElement();
    });

    it('add menu item with class content-types is hidden', function () {
      expect(container.find('.content-types')).toBeNgHidden();
    });

    it('add menu item with class no-content-types is not hidden', function () {
      expect(container.find('.no-content-types')).not.toBeNgHidden();
    });

  });


});
