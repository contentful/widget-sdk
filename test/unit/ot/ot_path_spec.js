'use strict';

describe('otPath directive', function () {
  var scope;

  beforeEach(function () {
    module('contentful/test');
    var OtDoc = this.$inject('mocks/OtDoc');

    this.rootDoc = new OtDoc({
      foo: {bar: 'INITIAL'}
    });

    scope = this.$compile('<div ot-path="[\'foo\', \'bar\']" />', {
      otDoc: {
        doc: this.rootDoc
      }
    }, {
      otDocFor: {}
    }).scope();
    this.$apply();
  });

  afterEach(function () {
    scope = null;
  });

  it('provides "otPath" on the scope', function () {
    expect(scope.otPath).toEqual(['foo', 'bar']);
  });

  it('provides "otSubDoc.doc" on the scope', function () {
    expect(scope.otSubDoc.doc.path).toEqual(['foo', 'bar']);
  });

  it('replaces the subdoc if the otDoc has been changed', function () {
    var OtDoc = this.$inject('mocks/OtDoc');

    var oldSubdoc = scope.otSubDoc.doc;
    scope.otDoc.doc = new OtDoc();
    this.$apply();
    expect(scope.otSubDoc.doc).toBeTruthy();
    expect(scope.otSubDoc.doc).not.toBe(oldSubdoc);
  });

  describe('#removeValue()', function () {
    it('calls "remove()" on OT sub doc', function () {
      scope.otSubDoc.doc.remove = sinon.stub();
      scope.otSubDoc.removeValue();
      this.$apply();
      sinon.assert.calledOnce(scope.otSubDoc.doc.remove);
    });

    it('rejects promise if "remove()" throws an error', function () {
      // This happens when the value at the path does not exist anymore
      var error = new Error();
      scope.otSubDoc.doc.remove = sinon.stub().throws(error);

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
    it('returns value from entity data when sharejs doc is not defined', function () {
      dotty.put(scope, ['entity', 'data'].concat(scope.otPath), 'ENTITY VALUE');
      scope.otDoc.doc = undefined;
      expect(scope.otSubDoc.getValue()).toEqual('ENTITY VALUE');
    });
  });


  describe('on "otRemoteOp" event', function () {
    beforeEach(function () {
      sinon.stub(scope, '$broadcast');
    });

    describe('with the exact Path', function () {
      it('broadcasts otValueChanged', function () {
        scope.$emit('otRemoteOp', {p: ['foo', 'bar']});
        sinon.assert.calledWith(scope.$broadcast, 'otValueChanged', scope.otPath, 'INITIAL');
      });
    });

    describe('with a different Path', function () {
      it('does not broadcast otValueChanged', function () {
        scope.$emit('otRemoteOp', {p: ['foo', 'bar2']});
        scope.$emit('otRemoteOp', {p: ['foo']});
        scope.$emit('otRemoteOp', {p: ['foo']});
        sinon.assert.notCalled(scope.$broadcast);
      });
    });

    describe('when otPath is prefix of operation path', function () {
      it('broadcasts otValueChanged', function () {
        scope.$emit('otRemoteOp', {p: ['foo', 'bar', 'x']});
        sinon.assert.calledWith(scope.$broadcast, 'otValueChanged', scope.otPath, 'INITIAL');
      });
    });
  });

  describe('#changeValue()', function () {
    it('resolves the promise', function () {
      var success = sinon.spy();
      scope.otSubDoc.changeValue('VALUE').then(success);
      this.$apply();
      sinon.assert.called(success);
    });

    it('sets the value when path is present', function () {
      scope.otSubDoc.changeValue('VALUE');
      this.$apply();
      expect(this.rootDoc.getAt(['foo', 'bar'])).toEqual('VALUE');
    });

    it('sets the value when path is not present', function () {
      this.rootDoc.set({});
      scope.otSubDoc.changeValue('VALUE');
      this.$apply();
      expect(this.rootDoc.getAt(['foo', 'bar'])).toEqual('VALUE');
    });

    /**
     * Tests that when `null` is passed to `scope.otSubDoc.changeValue()` it
     * should return $q.reject() and log a warning. See BUG#6696
     */
    describe('when the value is changed to null', function () {
      it('it does not change the value', function () {
        scope.otSubDoc.changeValue(null);
        this.$apply();
        expect(scope.otSubDoc.getValue()).toEqual('INITIAL');
      });

      it('rejects the promise', function () {
        var fail = sinon.spy();
        scope.otSubDoc.changeValue(null).catch(fail);
        this.$apply();
        sinon.assert.called(fail);
      });

      it('logs a warning', function () {
        var logger = this.$inject('logger');
        scope.otSubDoc.changeValue(null);
        sinon.assert.called(logger.logWarn);
      });
    });
  });

  describe('#changeString()', function () {
    pit('should update value in doc at path', function () {
      dotty.put(scope.otDoc.doc.snapshot, scope.otPath, '');
      return scope.otSubDoc.changeString('value').then(function () {
        expect(scope.otDoc.doc.getAt(scope.otPath)).toBe('value');
      });
    });
  });
});
