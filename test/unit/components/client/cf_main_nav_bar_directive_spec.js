'use strict';

describe('Main nav bar directive', function () {

  var container, scope, accessChecker, stubs;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['section', 'viewType', 'isHibernated']);
      $provide.removeDirectives('otDocFor', 'otDocPresence', 'entryEditor', 'apiKeyEditor', 'entryList', 'cfIcon');
      $provide.removeControllers('UiConfigController');
    });

    var $compile = this.$inject('$compile');
    scope = this.$inject('$rootScope').$new();
    accessChecker = this.$inject('accessChecker');
    accessChecker.getSectionVisibility = sinon.stub().returns({});

    compileElement = function () {
      container = $('<cf-main-nav-bar></cf-main-nav-bar>');
      $compile(container)(scope);
      scope.$apply();
    };
  });

  afterEach(function () {
    container.remove();
  });

  it('main navigation not shown if space is defined but hibernated', function () {
    stubs.isHibernated.returns(true);
    compileElement();
    expect(container.find('.nav-bar__list')).toBeNgHidden();
  });

  function makeNavbarItemTest(key, viewType){
    describe('navbar item for '+key, function () {
      var selector = 'a[data-view-type="'+viewType+'"]';

      it('is hidden', function () {
        accessChecker.getSectionVisibility.returns(getVisibility(key, false));
        compileElement();
        expect(container.find(selector).length).toEqual(0);
      });

      it('is shown', function () {
        accessChecker.getSectionVisibility.returns(getVisibility(key, true));
        compileElement();
        expect(container.find(selector).length).toEqual(1);
      });
    });
  }

  function getVisibility(key, value) {
    var returnVal = {};
    returnVal[key] = value;
    return returnVal;
  }

  makeNavbarItemTest('apiKey', 'api-home');
  makeNavbarItemTest('contentType', 'content-type-list');
  makeNavbarItemTest('settings', 'space-settings');
});
