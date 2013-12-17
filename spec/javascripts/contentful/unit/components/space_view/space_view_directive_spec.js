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
});
