'use strict';

describe('Main nav bar directive', function () {

  var container, scope, accessChecker, stubs, spaceContext;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['section', 'viewType']);
      $provide.removeDirectives('otDocPresence', 'entryEditor', 'apiKeyEditor', 'entryList', 'cfIcon');
      $provide.removeControllers('UiConfigController');
    });

    var $compile = this.$inject('$compile');
    spaceContext = this.mockService('spaceContext', {
      space: { isHibernated: sinon.stub().returns(false) }
    });
    scope = this.$inject('$rootScope').$new();
    accessChecker = this.$inject('accessChecker');
    accessChecker.getSectionVisibility = sinon.stub().returns({});

    spaceContext.space.isHibernated = sinon.stub().returns(false);

    compileElement = function () {
      container = $('<cf-main-nav-bar></cf-main-nav-bar>');
      $compile(container)(scope);
      scope.$apply();
    };
  });

  afterEach(function () {
    container.remove();
    container = scope = accessChecker =
      stubs = compileElement = null;
  });

  describe('hide navigation when space is hibernated', function () {
    beforeEach (function () {
      accessChecker.getSectionVisibility.returns({ contentType: true });
    });

    it('items shown if space is defined and not hibernated', function () {
      compileElement();
      expect(container.find('li.nav-bar__list-item > a.nav-bar__link').length).toBeGreaterThan(0);
    });

    it('items not shown if space is defined but hibernated', function () {
      spaceContext.space.isHibernated.returns(true);
      compileElement();
      expect(container.find('li.nav-bar__list-item > a.nav-bar__link').length).toBe(0);
    });
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
