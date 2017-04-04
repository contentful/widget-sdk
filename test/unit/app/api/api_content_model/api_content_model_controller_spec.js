'use strict';

describe('apiContentModel Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    this.spaceContext = this.$inject('mocks/spaceContext').init();

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');

    this.create = function () {
      const scope = $rootScope.$new();
      $controller('apiContentModelController', {$scope: scope});
      scope.$apply();
      return scope;
    };
  });

  it('assigns content types', function () {
    this.spaceContext.publishedCTs.refresh.resolves('CTS');
    const scope = this.create();
    expect(scope.contentTypes).toBe('CTS');
  });
});
