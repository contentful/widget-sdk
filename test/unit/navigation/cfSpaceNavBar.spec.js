'use strict';

describe('Space nav bar directive', function () {
  let container, scope, accessChecker, spaceContext;
  let compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otDocPresence', 'entryEditor', 'apiKeyEditor', 'entryList', 'cfIcon');
    });

    const $compile = this.$inject('$compile');
    spaceContext = this.mockService('spaceContext', {space: {}});
    scope = this.$inject('$rootScope').$new();
    accessChecker = this.$inject('access_control/AccessChecker');
    accessChecker.getSectionVisibility = sinon.stub().returns({});

    spaceContext.organizationContext = {organization: {sys: {id: '123'}}};

    compileElement = function () {
      container = $('<cf-space-nav-bar></cf-space-nav-bar>');
      $compile(container)(scope);
      scope.$apply();
    };
  });

  afterEach(function () {
    container.remove();
    container = scope = accessChecker = compileElement = null;
  });

  function makeNavbarItemTest (key, viewType) {
    describe('navbar item for ' + key, function () {
      const selector = 'a[data-view-type="' + viewType + '"]';

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

  function getVisibility (key, value) {
    const returnVal = {};
    returnVal[key] = value;
    return returnVal;
  }

  makeNavbarItemTest('apiKey', 'api-home');
  makeNavbarItemTest('contentType', 'content-type-list');
  makeNavbarItemTest('settings', 'space-settings');
});
