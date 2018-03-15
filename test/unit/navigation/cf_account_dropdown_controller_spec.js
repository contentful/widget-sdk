'use strict';

describe('Account Dropdown Controller', function () {
  beforeEach(function () {
    const stubs = this.stubs = {};

    module('contentful/test', function ($provide) {
      $provide.value('analytics/Analytics', stubs.analytics);
      $provide.value('Authentication', stubs.authentication);
      $provide.value('$window', stubs.window);
    });

    this.stubs.analytics = {track: sinon.stub(), disable: sinon.stub()};
    this.stubs.authentication = {logout: sinon.stub()};
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

  describe('calls logout', function () {
    beforeEach(function () {
      this.scope.logout();
    });

    it('tracks the logout and then disables tracking', function () {
      sinon.assert.called(this.stubs.analytics.track);
      sinon.assert.called(this.stubs.analytics.disable);
    });

    it('logs out through authentication', function () {
      sinon.assert.called(this.stubs.authentication.logout);
    });
  });
});
