'use strict';

describe('Account Dropdown Controller', function () {
  beforeEach(function () {
    const stubs = this.stubs = {};

    module('contentful/test', function ($provide) {
      $provide.value('analytics/Analytics', stubs.analytics);
      $provide.value('Authentication', stubs.authentication);
      $provide.value('$window', stubs.window);
      $provide.value('utils/LaunchDarkly', { setOnScope: function () {} });
    });

    this.stubs.analytics = {track: sinon.stub()};
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

    it('tracks analytics event', function () {
      sinon.assert.called(this.stubs.analytics.track);
    });

    it('logs out through authentication', function () {
      sinon.assert.called(this.stubs.authentication.logout);
    });
  });
});
