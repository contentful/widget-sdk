import createFieldLocaleDoc from 'app/entity_editor/FieldLocaleDocument.es6';
import * as sinon from 'helpers/sinon';
import { create as createDocument } from 'helpers/mocks/entity_editor_document';

describe('entityEditor/FieldLocaleDocument', () => {
  const path = ['fields', 'FID', 'LC'];

  beforeEach(function() {
    module('contentful/test');

    this.rootDoc = createDocument();
    this.doc = createFieldLocaleDoc(this.rootDoc, 'FID', 'LC');
  });

  describe('delegates', () => {
    testMethodDelegate('get', 'getValueAt');
    testMethodDelegate('set', 'setValueAt', ['VAL']);
    testMethodDelegate('remove', 'removeValueAt');

    describe('with array value', () => {
      beforeEach(function() {
        this.doc.set(['A', 'B']);
      });

      testMethodDelegate('push', 'pushValueAt', ['VAL']);
      testMethodDelegate('insert', 'insertValueAt', [1, 'VAL']);
    });

    function testMethodDelegate(method, target, args = []) {
      it(`delegates calls to ${method}`, function() {
        this.rootDoc[target].reset();
        this.doc[method].apply(null, args);
        const targetArgs = [path].concat(args);
        sinon.assert.calledWith(this.rootDoc[target], ...targetArgs);
      });
    }
  });

  describe('#valueProperty()', () => {
    it('has initial value', function() {
      this.rootDoc.setValueAt(path, 'VAL');
      const changed = sinon.stub();

      this.doc.valueProperty.onValue(changed);
      sinon.assert.calledWith(changed, 'VAL');
    });

    it('update value when root doc changes at path', function() {
      const changed = sinon.stub();
      this.doc.valueProperty.onValue(changed);
      changed.reset();

      this.rootDoc.setValueAt(path, 'VAL');
      sinon.assert.calledWith(changed, 'VAL');
    });

    it('does not update value when "set()" is called', function() {
      const changed = sinon.stub();
      this.doc.valueProperty.onValue(changed);
      changed.reset();

      this.doc.set('VAL');
      this.rootDoc.setValueAt(path, 'VAL');
      sinon.assert.notCalled(changed);
    });
  });

  describe('#fieldChanges$', () => {
    it('emits when root document emits "localFieldChanges$" for current field', function() {
      const emitted = sinon.spy();
      this.doc.localChanges$.onValue(emitted);
      this.rootDoc.localFieldChanges$.emit(['FID', 'LC-other']);
      this.rootDoc.localFieldChanges$.emit(['FID-other', 'LC']);
      sinon.assert.notCalled(emitted);
      this.rootDoc.localFieldChanges$.emit(['FID', 'LC']);
      sinon.assert.calledOnce(emitted);
    });
  });
});
