'use strict';

describe('Space Selector Controller', function () {
  let scope, analytics;

  afterEach(function () {
    scope = analytics = null;
  });

  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    const spaceContext = this.$inject('spaceContext');
    analytics = this.$inject('analytics');
    sinon.stub(analytics, 'track');

    scope = $rootScope.$new();
    spaceContext.space = {
      getId: function () { return 1; },
      data: { organization: { sys: { id: 456 } } }
    };

    $controller('cfSpaceSelectorController', { $scope: scope });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    sinon.assert.called(analytics.track);
  });
});
