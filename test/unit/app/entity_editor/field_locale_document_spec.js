import sinon from 'sinon';
import { $initialize, $inject } from 'test/helpers/helpers';

describe('entityEditor/FieldLocaleDocument', () => {
  const fieldsPath = ['FID', 'LC'];
  const path = ['fields', ...fieldsPath];

  beforeEach(async function() {
    const createFieldLocaleDoc = (await this.system.import(
      'app/entity_editor/FieldLocaleDocument.es6'
    )).default;

    await $initialize(this.system);

    const createDocument = $inject('mocks/entityEditor/Document').create;

    this.rootDoc = createDocument();
    this.doc = createFieldLocaleDoc(this.rootDoc, ...fieldsPath);
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

  describe('#set() / #get()', () => {
    it('gets `undefined` initially', function() {
      expect(this.doc.get()).toEqual(undefined);
    });

    it('gets value set in rootDoc', function() {
      this.rootDoc.setValueAt(path, 'VAL-123');
      expect(this.doc.get()).toEqual('VAL-123');
    });

    it('sets and gets', function() {
      this.doc.set('VAL-FOO');
      expect(this.doc.get()).toEqual('VAL-FOO');
    });
  });

  describe('#valueProperty()', () => {
    it('has initial value', function() {
      this.rootDoc.setValueAt(path, 'VAL');
      const changed = sinon.stub();

      this.doc.valueProperty.onValue(changed);
      sinon.assert.calledWith(changed, 'VAL');
    });

    describe('change handling', function() {
      beforeEach(function() {
        this.changed = sinon.stub();
        this.doc.valueProperty.onValue(this.changed);
        this.changed.reset();
      });

      it('updates value when root doc changes at path', function() {
        this.rootDoc.setValueAt(path, 'VAL');
        sinon.assert.calledWith(this.changed, 'VAL');
      });

      it('updates value when root doc changes and reverts ', function() {
        const initialValue = this.doc.get();
        this.rootDoc.setValueAt(path, `${initialValue || ''}VAL`);
        this.rootDoc.setValueAt(path, initialValue);
        sinon.assert.calledWith(this.changed, initialValue);
      });

      it('does not update value when "set()" is called', function() {
        this.doc.set('VAL');
        this.rootDoc.setValueAt(path, 'VAL');
        sinon.assert.notCalled(this.changed);
      });
    });
  });

  describe('#fieldChanges$', () => {
    it('emits when root document emits "localFieldChanges$" for current field', function() {
      const emitted = sinon.spy();
      this.doc.localChanges$.onValue(emitted);
      this.rootDoc.localFieldChanges$.emit(['FID', 'LC-other']);
      this.rootDoc.localFieldChanges$.emit(['FID-other', 'LC']);
      sinon.assert.notCalled(emitted);
      this.rootDoc.localFieldChanges$.emit(fieldsPath);
      sinon.assert.calledOnce(emitted);
    });
  });
});
