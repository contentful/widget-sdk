import $ from 'jquery';
import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';

describe('Space nav bar directive', () => {
  let container, scope, spaceContext;
  let compileElement;

  beforeEach(async function() {
    this.stubs = {
      getSectionVisibility: sinon.stub().returns({})
    };

    this.system.set('components/shared/QuickNavigation/QuickNavWithFeatureFlag.es6', {
      default: () => null
    });

    this.system.set('access_control/AccessChecker', {
      getSectionVisibility: this.stubs.getSectionVisibility
    });

    await $initialize(this.system);

    const $compile = $inject('$compile');
    spaceContext = Object.assign($inject('spaceContext'), {
      space: {
        environmentMeta: {
          isMasterEnvironment: true
        }
      },
      getEnvironmentId: sinon.stub().returns('master')
    });
    scope = $inject('$rootScope').$new();

    spaceContext.organization = { sys: { id: '123' } };

    compileElement = () => {
      container = $('<cf-space-nav-bar></cf-space-nav-bar>');
      $compile(container)(scope);
      scope.$apply();
    };
  });

  afterEach(() => {
    container.remove();
    container = scope = compileElement = null;
  });

  function makeNavbarItemTest(key, viewType) {
    describe('navbar item for ' + key, () => {
      const selector = 'a[data-view-type="' + viewType + '"]';

      it('is hidden', function() {
        this.stubs.getSectionVisibility.returns(getVisibility(key, false));
        compileElement();
        expect(container.find(selector).length).toEqual(0);
      });

      it('is shown', function() {
        this.stubs.getSectionVisibility.returns(getVisibility(key, true));
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
