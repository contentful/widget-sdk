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
          doc: {
            getAt: function () {
              return aValue;
            }
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

  it('should provide otPath on the scope', function() {
    expect(scope.otPath).toLookEqual(['FOO', 'bar']);
  });

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
        scope.otDoc.doc.setAt = function (path, value, callback) {
          _.defer(callback, null);
        };
        spyOn(scope.otDoc.doc, 'setAt');
        scope.otChangeValue('bla');
        expect(scope.otDoc.doc.setAt).toHaveBeenCalled();
        expect(scope.otDoc.doc.setAt.calls.mostRecent().args[0]).toEqual(scope.otPath);
        expect(scope.otDoc.doc.setAt.calls.mostRecent().args[1]).toEqual('bla');
      });
    });
    describe('when the path is not present in the otDoc', function () {
      it('should mkpathAndSetValue the value', function () {
        var mkpathAndSetValue;
        inject(function (ShareJS) {
          mkpathAndSetValue = ShareJS.mkpathAndSetValue = jasmine.createSpy('mkpathAndSetValue');
        });
        scope.otChangeValue('bla');
        expect(mkpathAndSetValue).toHaveBeenCalled();
        expect(mkpathAndSetValue.calls.mostRecent().args[0]).toEqual({
          doc: scope.otDoc.doc,
          path: scope.otPath,
          types: undefined,
          value: 'bla'
        });
      });
    });
  });

});
