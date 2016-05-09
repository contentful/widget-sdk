'use strict';

describe('otPath', function () {
  var elem, scope;
  var aValue = {};
  var peekValue = {};

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('otDocForController');
    });
    var $rootScope = this.$inject('$rootScope');
    var $compile = this.$inject('$compile');
    var ShareJS = this.$inject('ShareJS');

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

  it('should provide otPath on the scope', function () {
    expect(scope.otPath).toLookEqual(['FOO', 'bar']);
  });

  describe('receiving otRemoteOp', function () {
    beforeEach(function () {
      sinon.stub(scope, '$broadcast');
    });

    describe('with the exact Path', function () {
      it('should broadCast otValueChanged', function () {
        scope.$emit('otRemoteOp', {p: ['FOO', 'bar']});
        sinon.assert.calledWith(scope.$broadcast, 'otValueChanged', scope.otPath, aValue);
      });
    });

    describe('with a different Path', function () {
      it('should not broadcast otValueChanged', function () {
        scope.$emit('otRemoteOp', {p: ['FOO', 'bar2']});
        sinon.assert.notCalled(scope.$broadcast);
      });

      describe('when otPath is prefix of operation path', function () {
        it('should broadcast otValueChanged', function () {
          var op = {p: scope.otPath.slice(0)};

          // make operation path longer than otPath
          op.p.push(100);
          expect(op.p.length).toBeGreaterThan(scope.otPath.length);

          scope.$emit('otRemoteOp', op);
          sinon.assert.calledWith(scope.$broadcast, 'otValueChanged', scope.otPath, aValue);
        });
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

    var $compile = this.$inject('$compile');
    this.compileElement = function (scope) {
      return $compile('<div ot-doc-for><div ot-path="[\'fields\', \'field\']"></div></div>')(scope).find('*[ot-path]');
    };

    var $rootScope = this.$inject('$rootScope');
    $rootScope.otDoc = makeDoc();
    $rootScope.entity = {
      data: {
        fields: {
          someField: {
            'en_US': 'test'
          }
        }
      }
    };
    $rootScope.field = {
      id: 'someField'
    };
    $rootScope.locale = {
      internal_code: 'en_US'
    };
    $rootScope.otPath = ['path'];

    elem = this.compileElement($rootScope);
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

  describe('#getValue()', function () {
    it('should return initial value from entity data when sharejs doc is not defined', function () {
      scope.otDoc.doc = undefined;

      expect(scope.otSubDoc.getValue()).toEqual('test');
    });
  });

  describe('#changeString()', function () {
    beforeEach(function () {
      var $rootScope = this.$inject('$rootScope');
      var OtDoc = this.$inject('mocks/OtDoc');

      $rootScope.otDoc = { doc: new OtDoc() };
      elem = this.compileElement($rootScope);
      scope = elem.scope();
      scope.$apply();
    });
    pit('should update value in doc at path', function () {
      dotty.put(scope.otDoc.doc.snapshot, scope.otPath, '');
      return scope.otSubDoc.changeString('value').then(function () {
        expect(scope.otDoc.doc.getAt(scope.otPath)).toBe('value');
      });
    });
  });

  function makeDoc () {
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
