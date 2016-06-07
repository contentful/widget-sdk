'use strict';

describe('otPath directive', function () {
  var path;

  beforeEach(function () {
    module('contentful/test');
    var OtDoc = this.$inject('mocks/OtDoc');

    path = ['foo', 'bar'];
    this.otDoc = {
      doc: new OtDoc({foo: {bar: 'INITIAL'}}),
      getValueAt: sinon.stub().withArgs(path).returns('INITIAL')
    };

    this.scope = this.$compile('<div ot-path="[\'foo\', \'bar\']" />', {
      otDoc: this.otDoc
    }, {
      otDocFor: {}
    }).scope();
    this.subDoc = this.scope.otSubDoc;
    this.$apply();
  });

  describe('#set()', function () {
    it('delegates to otDoc', function () {
      this.otDoc.setValueAt = sinon.stub();
      this.subDoc.set('VAL');
      sinon.assert.calledWith(this.otDoc.setValueAt, path, 'VAL');
    });
  });

  describe('#setString()', function () {
    it('set value if previous value is empty string', function () {
      this.otDoc.getValueAt.withArgs(path).returns(undefined);
      this.otDoc.setValueAt = sinon.stub().resolves();
      this.subDoc.setString('value');
      sinon.assert.calledWithExactly(this.otDoc.setValueAt, path, 'value');
    });
  });

  describe('#remove()', function () {
    it('delegates to otDoc', function () {
      this.otDoc.removeValueAt = sinon.stub();
      this.subDoc.remove();
      sinon.assert.calledWith(this.otDoc.removeValueAt, path);
    });
  });

  describe('#get()', function () {
    it('delegates to otDoc', function () {
      this.otDoc.removeValueAt = sinon.stub();
      this.subDoc.remove();
      sinon.assert.calledWith(this.otDoc.removeValueAt, path);
    });
  });

  describe('#onValuechange()', function () {
    beforeEach(function () {
      this.onValueChanged = sinon.stub();
      this.otDoc.getValueAt.withArgs(path).returns('VAL');
      this.subDoc.onValueChanged(this.onValueChanged);
      this.onValueChanged.reset();
    });

    it('dispatches with initial value', function () {
      var changed = sinon.stub();
      this.subDoc.onValueChanged(changed);
      sinon.assert.calledWith(changed, 'INITIAL');
    });

    it('dispatches when document changes', function () {
      var OtDoc = this.$inject('mocks/OtDoc');
      this.otDoc.doc = new OtDoc();
      this.$apply();
      sinon.assert.calledWithExactly(this.onValueChanged, 'VAL');
    });

    it('dispatches on "otValueReverted" event', function () {
      this.scope.$emit('otValueReverted');
      sinon.assert.calledWithExactly(this.onValueChanged, 'VAL');
    });

    it('dispatches on remote op on affecting path', function () {
      var remoteOpPaths = [
        ['foo'],
        ['foo', 'bar'],
        ['foo', 'bar', 'x'],
        ['foo', 'bar', 'x', 'y']
      ];

      remoteOpPaths.forEach(function (p) {
        this.onValueChanged.reset();
        this.scope.$emit('otRemoteOp', {p: p});
        sinon.assert.calledWithExactly(this.onValueChanged, 'VAL');
      }.bind(this));
    });

    it('does not dispatche on remote op on non-affecting path', function () {
      var remoteOpPaths = [
        ['x'],
        ['foo', 'x'],
        ['x', 'bar'],
        ['x', 'bar', 'y']
      ];

      remoteOpPaths.forEach(function (p) {
        this.onValueChanged.reset();
        this.scope.$emit('otRemoteOp', {p: p});
        sinon.assert.notCalled(this.onValueChanged, 'VAL');
      }.bind(this));
    });
  });

});
