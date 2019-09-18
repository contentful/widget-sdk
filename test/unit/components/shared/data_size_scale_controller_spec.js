import { $initialize, $inject } from 'test/utils/ng';

describe('DataSizeScaleController', () => {
  beforeEach(async function() {
    await $initialize(this.system);

    const $controller = $inject('$controller');
    this.parentScope = $inject('$rootScope');
    this.parentScope.size = 1;
    this.scope = this.parentScope.$new();
    this.controller = $controller('DataSizeScaleController', {
      $scope: this.scope,
      $attrs: { model: 'size' }
    });
    this.scope.$apply();
  });

  it('update model value if unit changes', function() {
    this.scope.unitFactor = 1024;
    this.scope.$apply();
    expect(this.parentScope.size).toEqual(1024);
  });

  it('update model value if scaled value changes', function() {
    this.scope.value = 3;
    this.scope.$apply();
    expect(this.parentScope.size).toEqual(3);
  });

  it('update scaled value if model value changes', function() {
    this.scope.unitFactor = 1024;
    this.parentScope.size = 2048;
    this.scope.$apply();
    expect(this.scope.value).toEqual(2);
  });
});
