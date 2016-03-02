'use strict';

describe('otPath', function() {
  var elem, scope, aValue={}, peekValue={};
  beforeEach(function() {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('otDocForController');
    });
    var $rootScope  = this.$inject('$rootScope');
    var $compile    = this.$inject('$compile');
    var ShareJS     = this.$inject('ShareJS');


    $rootScope.foo = 'FOO';
    $rootScope.entity = 'ENTITY';
    $rootScope.otDoc = {
      doc: {
        at: sinon.spy(),
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
    $rootScope.$apply();
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
        this.$apply();
        expect(scope.otDoc.doc.setAt).toHaveBeenCalled();
        expect(scope.otDoc.doc.setAt.calls.mostRecent().args[0]).toEqual(scope.otPath);
        expect(scope.otDoc.doc.setAt.calls.mostRecent().args[1]).toEqual('bla');
      });
    });

    describe('when the path is not present in the otDoc', function () {
      it('should mkpathAndSetValue the value', function () {
        var ShareJS = this.$inject('ShareJS');
        sinon.stub(ShareJS, 'mkpathAndSetValue').resolves();
        scope.otSubDoc.changeValue('bla');
        this.$apply();
        sinon.assert.calledWith(
          ShareJS.mkpathAndSetValue,
          scope.otDoc.doc, scope.otPath, 'bla'
        );
      });
    });

    /**
     * Tests that when `null` is passed to `scope.otSubDoc.changeValue()` it
     * should return $q.reject() and log a warning. See BUG#6696
     */
    describe('when the value is changed to null', function () {
      it('should replace the value with undefined and log a warning',
      function () {
        var logger = this.$inject('logger');
        var success = sinon.spy();
        var fail = sinon.spy();
        scope.otDoc.doc.setAt = sinon.spy();
        scope.otPath = 'foo';

        scope.otSubDoc.changeValue(null).then(success).catch(fail);
        scope.$apply();
        sinon.assert.notCalled(success);
        sinon.assert.called(fail);
        sinon.assert.called(logger.logWarn);
      });
    });
  });

});

describe('otSubdoc', function () {
  var elem, scope, subdoc;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otDocFor', {
        controller: _.noop
      });
    });
    var $rootScope    = this.$inject('$rootScope');
    var $compile      = this.$inject('$compile');

    $rootScope.otDoc = makeDoc();
    $rootScope.otPath = ['path'];
    elem = $compile('<div ot-doc-for><div ot-path="[\'fields\', \'field\']"></div></div>')($rootScope).find('*[ot-path]');
    scope = elem.scope();
    scope.$apply();
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

  describe('#removeValue()', function () {
    var docRemove;

    beforeEach(function () {
      docRemove = sinon.stub();
      scope.otSubDoc.doc.remove = docRemove;
    });

    it('calls "remove()" on OT sub doc', function () {
      scope.otSubDoc.removeValue();
      this.$apply();
      sinon.assert.calledOnce(docRemove);
    });

    it('rejects promise if "remove()" throws an error', function () {
      // This happens when the value at the path does not exist anymore
      var error = new Error();
      docRemove.throws(error);

      var errorHandler = sinon.stub();
      scope.otSubDoc.removeValue().catch(errorHandler);
      this.$apply();
      sinon.assert.calledWithExactly(errorHandler, error);
    });

    it('rejects promise if sub document does not exist', function () {
      delete scope.otSubDoc.doc;

      var errorHandler = sinon.stub();
      scope.otSubDoc.removeValue().catch(errorHandler);
      this.$apply();
      sinon.assert.called(errorHandler);
    });
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
