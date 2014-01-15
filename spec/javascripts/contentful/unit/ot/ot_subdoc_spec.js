'use strict';

describe('otSubdoc', function () {
  var elem, scope, subdoc;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otDocFor', {
        controller: function() { }
      });
      $provide.removeDirectives('otPath');
    });
    inject(function ($compile, $rootScope) {
      $rootScope.otDoc = makeDoc();
      $rootScope.otPath = ['path'];
      elem = $compile('<div ot-doc-for><div ot-subdoc></div></div>')($rootScope).find('*[ot-subdoc]');
      scope = elem.scope();
      scope.$apply();
    });
  });


  afterEach(function () {
    inject(function ($log) {
      $log.assertEmpty();
    });
  });

  it('should install subdoc on the scope', function () {
    expect(scope.otSubdoc).toBe(subdoc);
  });

  it('should update the subdoc path if the path has been changed', function () {
    var oldSubdoc = scope.otSubdoc;
    scope.$root.otPath = ['otherpath'];
    scope.$apply();
    expect(scope.otSubdoc.path[0]).toBe('otherpath');
    expect(scope.otSubdoc).toBe(oldSubdoc);
  });

  it('should replace the subdoc if the otDoc has been changed', function () {
    var oldSubdoc = scope.otSubdoc;
    scope.$root.otDoc = makeDoc();
    scope.$apply();
    expect(scope.otSubdoc).toBeTruthy();
    expect(scope.otSubdoc).not.toBe(oldSubdoc);
  });

  it('should set the subdoc to null if the otDoc disappears', function () {
    scope.$root.otDoc = null;
    scope.$apply();
    expect(scope.otSubdoc).toBe(null);
  });

  it('should set the subdoc to null if the otPath disappears', function () {
    scope.$root.otPath = null;
    scope.$apply();
    expect(scope.otSubdoc).toBe(null);
  });

  function makeDoc() {
    return {
      at: function (path) {
        var doc = this;
        subdoc = {
          doc: doc,
          path: path
        };
        return subdoc;
      }
    };
  }
});


