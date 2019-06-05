'use strict';

describe('Account Dropdown Controller', () => {
  beforeEach(function() {
    const stubs = (this.stubs = {});

    module('contentful/test', $provide => {
      $provide.value('analytics/Analytics.es6', stubs.analytics);
      $provide.value('Authentication.es6', stubs.authentication);
      $provide.value('utils/ngCompat/window.es6', {
        default: stubs.window
      });
    });

    this.stubs.analytics = { track: sinon.stub(), disable: sinon.stub() };
    this.stubs.authentication = { logout: sinon.stub() };
    this.stubs.window = {
      open: sinon.stub(),
      addEventListener: sinon.stub(),
      document: window.document
    };

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    this.scope = $rootScope.$new();
    $controller('cfAccountDropdownController', { $scope: this.scope });
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
