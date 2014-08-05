'use strict';

describe('otBindInternal', function () {
  var element, scope;

  beforeEach(function(){
    module('contentful/test', function($provide){
      $provide.stubDirective('otPath', {controller: angular.noop});
    });
  });

  beforeEach(inject(function ($rootScope, $compile, $q) {
    scope = $rootScope.$new();
    scope.otChangeValueP = sinon.stub().returns($q.when());
    scope.otPath         = 'path' ;
    scope.external       = {value: 'foo'};
    scope.internal       = {value: 'foo'};
    element = $compile('<div ot-bind-internal="internal.value" ng-model="external.value" ot-path="">')(scope);
    scope.$apply();
  }));

  describe('when the internal value is changed', function(){
    beforeEach(function(){
      scope.internal.value = 'bar';
    });

    describe('and OT change successful', function(){
      beforeEach(function(){
        scope.otBindInternalChangeHandler();
        scope.$apply();
      });
      it('should update OT', function(){
        expect(scope.otChangeValueP).toBeCalledWith('bar');
      });
      it('should update the external value', function(){
        expect(scope.external.value).toBe('bar');
      });
    });
    describe('and OT change fails', function(){
      beforeEach(inject(function($q){
        scope.otChangeValueP.returns($q.reject());
        scope.otBindInternalChangeHandler();
        scope.$apply();
      }));
      it('should try to update OT', function(){
        expect(scope.otChangeValueP).toBeCalledWith('bar');
      });
      it('should reset the internal value', function(){
        expect(scope.internal.value).toBe('foo');
      });
    });
  });

  describe('when the external value is changed', function(){
    beforeEach(function(){
      scope.external.value = 'bar';
      scope.$apply();
    });
    it('the internal value should be updated', function(){
      expect(scope.internal.value).toBe('bar');
    });
  });

  describe('when a change is received via OT', function(){
    beforeEach(function(){
      scope.$broadcast('otValueChanged', 'path', 'bar');
      scope.$apply();
    });
    it('it should upate the external and internal value', function(){
      expect(scope.external.value).toBe('bar');
      expect(scope.internal.value).toBe('bar');
    });
  });
  
});
