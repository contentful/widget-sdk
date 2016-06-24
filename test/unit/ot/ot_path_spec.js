'use strict';

describe('otPath directive', function () {
  let path;

  beforeEach(function () {
    module('contentful/test');

    path = ['foo', 'bar'];
    this.otDoc = this.$inject('mocks/entityEditor/Document').create({
      foo: {bar: 'INITIAL'}
    });

    const scope = this.$compile('<div ot-path="[\'foo\', \'bar\']" />', {
      otDoc: this.otDoc
    }).scope();

    this.subDoc = scope.otSubDoc;
  });

  describe('#set()', function () {
    it('delegates to otDoc', function () {
      this.otDoc.setValueAt.reset();
      this.subDoc.set('VAL');
      sinon.assert.calledWith(this.otDoc.setValueAt, path, 'VAL');
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

  describe('#valueProperty()', function () {
    it('has initial value', function () {
      this.otDoc.valuePropertyAt(path).set('VAL');
      const changed = sinon.stub();

      this.subDoc.onValueChanged(changed);
      sinon.assert.calledWith(changed, 'VAL');
    });

    it('update value when root doc changes at path', function () {
      const changed = sinon.stub();
      this.subDoc.onValueChanged(changed);
      changed.reset();

      this.otDoc.valuePropertyAt(path).set('VAL');
      sinon.assert.calledWith(changed, 'VAL');
    });

    it('does not update value when "set()" is called', function () {
      const changed = sinon.stub();
      this.subDoc.onValueChanged(changed);
      changed.reset();

      this.subDoc.set('VAL');
      this.otDoc.valuePropertyAt(path).set('VAL');
      sinon.assert.notCalled(changed);
    });
  });
});
