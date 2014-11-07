'use strict';

describe('otPath', function() {
  var elem, scope, aValue={}, peekValue={};
  beforeEach(function() {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('otDocForController');
    });
    inject(function ($compile, $rootScope, ShareJS) {
      $rootScope.$apply(function () {
        $rootScope.foo = 'FOO';
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

  it('should provide otPath on the scope', function() {
    expect(scope.otPath).toLookEqual(['FOO', 'bar']);
  });

  it('should provide otChangeValue', function() {
    expect(scope.otChangeValue).toBeDefined();
  });

  it('otChangeValueP should be specced here');

  describe('receiving otRemoteOp', function () {
    describe('with the exact Path', function () {
      var op = {p: ['FOO', 'bar']};
      it('should broadCast otValueChanged', function () {
        spyOn(scope, '$broadcast');
        scope.$emit('otRemoteOp', op);
        expect(scope.$broadcast).toHaveBeenCalledWith('otValueChanged', scope.otPath, aValue);
      });
    });

    describe('with a different Path', function () {
      var op = {p: ['FOO', 'bar2']};
      it('should not broadcast otValueChanged', function () {
        spyOn(scope, '$broadcast');
        scope.$emit('otRemoteOp', op);
        expect(scope.$broadcast).not.toHaveBeenCalled();
      });
      
    });
  });

  describe('changing the value', function () {
    describe('when the path is present in the otDoc', function () {
      it('should set the value', function () {
        scope.otDoc.setAt = function (path, value, callback) {
          _.defer(callback, null);
        };
        spyOn(scope.otDoc, 'setAt');
        scope.otChangeValue('bla');
        expect(scope.otDoc.setAt).toHaveBeenCalled();
        expect(scope.otDoc.setAt.calls.mostRecent().args[0]).toEqual(scope.otPath);
        expect(scope.otDoc.setAt.calls.mostRecent().args[1]).toEqual('bla');
      });
    });
    describe('when the path is not present in the otDoc', function () {
      it('should mkpath the value', function () {
        var mkpath;
        inject(function (ShareJS) {
          mkpath = ShareJS.mkpath = jasmine.createSpy('mkpath');
        });
        scope.otChangeValue('bla');
        expect(mkpath).toHaveBeenCalled();
        expect(mkpath.calls.mostRecent().args[0]).toEqual({
          doc: scope.otDoc,
          path: scope.otPath,
          types: undefined,
          value: 'bla'
        });
      });
    });
  });

});
