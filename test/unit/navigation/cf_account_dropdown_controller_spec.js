import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';

describe('Account Dropdown Controller', () => {
  beforeEach(async function() {
    const stubs = (this.stubs = {});

    this.stubs.analytics = { track: sinon.stub(), disable: sinon.stub() };
    this.stubs.authentication = { logout: sinon.stub() };
    this.stubs.window = {
      open: sinon.stub(),
      addEventListener: sinon.stub(),
      document: window.document
    };

    this.system.set('analytics/Analytics', stubs.analytics);
    this.system.set('Authentication.es6', stubs.authentication);
    this.system.set('utils/ngCompat/window.es6', {
      default: stubs.window
    });

    await $initialize(this.system);

    const $rootScope = $inject('$rootScope');
    const $controller = $inject('$controller');
    this.scope = $rootScope.$new();
    $controller('cfAccountDropdownController', { $scope: this.scope });

    const waitForLoaded = async () => {
      if (this.scope.loaded) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve));

      return waitForLoaded();
    };

    await waitForLoaded();
  });

  describe('calls logout', () => {
    beforeEach(function() {
      this.scope.logout();
    });

    it('tracks the logout and then disables tracking', function() {
      sinon.assert.called(this.stubs.analytics.track);
      sinon.assert.called(this.stubs.analytics.disable);
    });

    it('logs out through authentication', function() {
      sinon.assert.called(this.stubs.authentication.logout);
    });
  });
});
