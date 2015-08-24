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
            at: sinon.stub(),
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
        scope.otSubDoc.changeValue('bla');
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
        scope.otSubDoc.changeValue('bla');
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

describe('otSubdoc', function () {
  var elem, scope, subdoc;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otDocFor', {
        controller: function() { }
      });
    });
    inject(function ($compile, $rootScope) {
      $rootScope.otDoc = makeDoc();
      $rootScope.otPath = ['path'];
      elem = $compile('<div ot-doc-for><div ot-path="[\'fields\', \'field\']"></div></div>')($rootScope).find('*[ot-path]');
      scope = elem.scope();
      scope.$apply();
    });
  });

  it('should install subdoc on the scope', function () {
    expect(scope.otSubDoc.doc).toBe(subdoc);
  });

  it('should update the subdoc path if the path has been changed', function () {
    var oldSubdoc = scope.otSubDoc.doc;
    scope.$apply();
    expect(scope.otSubDoc.doc.path[0]).toBe('fields');
    expect(scope.otSubDoc.doc).toBe(oldSubdoc);
  });

  it('should replace the subdoc if the otDoc has been changed', function () {
    var oldSubdoc = scope.otSubDoc.doc;
    scope.$root.otDoc = makeDoc();
    scope.$apply();
    expect(scope.otSubDoc.doc).toBeTruthy();
    expect(scope.otSubDoc.doc).not.toBe(oldSubdoc);
  });

  function makeDoc() {
    return {
      doc: {
        at: function (path) {
          var doc = this;
          subdoc = {
            doc: doc,
            path: path
          };
          return subdoc;
        }
      }
    };
  }
});
