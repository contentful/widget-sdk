'use strict';

describe('otBindModel', function () {
  var elem, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otPath', {
        priority: 600,
        controller: function() { }
      });
    });
    inject(function ($compile, $rootScope) {
      scope = $rootScope;
      scope.otPath = 'path';
      scope.fieldData = {value: 'a'};
      scope.otSubDoc = {};
      elem = $compile('<input type="text" ot-path ot-bind-model ng-model="fieldData.value">')(scope);
      scope.$apply();
    });
  });


  it('should call changeValue whenever the value is changed', function () {
    scope.otSubDoc.changeValue = sinon.stub();
    elem.val('b').trigger('input');
    sinon.assert.calledWith(scope.otSubDoc.changeValue, 'b');
  });

  it('should update the model value in response to otValueChanged', function () {
    scope.$emit('otValueChanged', 'path', 'b');
    expect(scope.fieldData.value).toBe('b');
  });
});
