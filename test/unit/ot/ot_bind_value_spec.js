'use strict';

describe('otBindValue', function () {
  var elem, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otPath', {
        priority: 600,
        controller: function() { }
      });
    });
    inject(function ($compile, $rootScope) {
      $rootScope.otPath = 'path';
      $rootScope.otChangeValue = sinon.stub();
      $rootScope.fieldData = {value: 'a'};
      elem = $compile('<div ot-path ot-bind-value="fieldData.value"></div>')($rootScope);
      scope = elem.scope();
      scope.$apply();
      scope.otChangeValue.reset();
    });
  });


  it('should call otChangeValue whenever the value is changed', function () {
    scope.fieldData.value = 'b';
    scope.$apply();
    expect(scope.otChangeValue.calledWith('b')).toBe(true);
  });

  it('should update the model value in response to otValueChanged', function () {
    scope.$emit('otValueChanged', 'path', 'b');
    expect(scope.fieldData.value).toBe('b');
  });
});

