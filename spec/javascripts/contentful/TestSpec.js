'use strict';

describe('otPath', function() {
  var elem, scope, aValue={}, peekValue={};
  beforeEach(function() {
    module('contentful/test', function ($controllerProvider) {
      $controllerProvider.register('otDocForCtrl',function () { });
    });
    inject(function ($compile, $rootScope, ShareJS) {
      $rootScope.$apply(function () {
        $rootScope.foo = 'FOO';
        $rootScope.bar = 'BAR';
        $rootScope.entity = 'ENTITY';
        $rootScope.otDoc = {
          getAt: function () {
            return aValue;
          }
        };
        elem = $compile('<div ot-doc-for="entity"><div ot-path="[foo, \'bar\']"></div></div>')($rootScope).find('div').get(0);
        scope = angular.element(elem).scope();
        ShareJS.peek = function () {
          return peekValue;
        };
      });
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should provide otPath', function() {
    expect(scope.otPath).toLookEqual(['FOO', 'bar']);
  });

  it('should provide otChangeValue', function() {
    expect(scope.otChangeValue).toBeDefined();
  });

  describe('receiving otRemoteOp', function () {
    var op = {p: []};
    describe('with the exact Path', function () {
      it('should broadCast otValueChanged', function () {
        op.p = ['FOO', 'bar'];
        spyOn(scope, '$broadcast');
        scope.$emit('otRemoteOp', op);
        expect(scope.$broadcast).toHaveBeenCalledWith('otValueChanged', scope.otPath, aValue);
      });
    });

    describe('with a different Path', function () {
      it('should not broadcast otValueChanged', function () {
        op.p = ['FOO', 'bar2'];
        spyOn(scope, '$broadcast');
        scope.$emit('otRemoteOp', op);
        expect(scope.$broadcast).not.toHaveBeenCalled();
      });
      
    });
  });

});
