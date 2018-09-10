'use strict';

describe('Space nav bar directive', () => {
  let container, scope, accessChecker, spaceContext;
  let compileElement;

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.removeDirectives(
        'otDocPresence',
        'entryEditor',
        'apiKeyEditor',
        'entryList',
        'cfIcon'
      );
    });

    const $compile = this.$inject('$compile');
    spaceContext = this.mockService('spaceContext', {
      space: {},
      getEnvironmentId: sinon.stub().returns('master')
    });
    scope = this.$inject('$rootScope').$new();
    accessChecker = this.$inject('access_control/AccessChecker');
    accessChecker.getSectionVisibility = sinon.stub().returns({});

    spaceContext.organization = { sys: { id: '123' } };

    compileElement = () => {
      container = $('<cf-space-nav-bar></cf-space-nav-bar>');
      $compile(container)(scope);
      scope.$apply();
    };
  });

  afterEach(() => {
    container.remove();
    container = scope = accessChecker = compileElement = null;
  });

  function makeNavbarItemTest(key, viewType) {
    describe('navbar item for ' + key, () => {
      const selector = 'a[data-view-type="' + viewType + '"]';

      it('is hidden', () => {
        accessChecker.getSectionVisibility.returns(getVisibility(key, false));
        compileElement();
        expect(container.find(selector).length).toEqual(0);
      });

      it('is shown', () => {
        accessChecker.getSectionVisibility.returns(getVisibility(key, true));
        compileElement();
        expect(container.find(selector).length).toEqual(1);
      });
    });
  }

  function getVisibility(key, value) {
    const returnVal = {};
    returnVal[key] = value;
    return returnVal;
  }

  makeNavbarItemTest('contentType', 'content-type-list');
  makeNavbarItemTest('settings', 'space-settings');
});
