'use strict';

describe('SnapshotComparatorController/snapshotDoc', () => {
  const data = {
    sys: {},
    fields: {
      field1: { 'en-US': 'lol' },
      field2: { 'de-DE': { some: 'prop' } }
    }
  };

  const mutatingMethods = ['setValueAt', 'removeValueAt', 'insertValueAt', 'pushValueAt'];

  beforeEach(function() {
    module('contentful/test');
    this.doc = this.$inject('SnapshotComparatorController/snapshotDoc').create(data);
    this.K = this.$inject('utils/kefir.es6');
  });

  describe('#getValueAt', () => {
    it('returns value at path', function() {
      expect(this.doc.getValueAt(['fields', 'field1', 'en-US'])).toBe('lol');
      expect(this.doc.getValueAt(['fields', 'field2', 'de-DE'])).toEqual({ some: 'prop' });
      expect(this.doc.getValueAt(['fields', 'field1'])).toEqual({ 'en-US': 'lol' });
      expect(this.doc.getValueAt(['fields', 'lol'])).toBeUndefined();
    });
  });

  describe('#valuePropertyAt', () => {
    it('returns a constant value property of path', function() {
      const property = this.doc.valuePropertyAt(['fields', 'field1', 'en-US']);
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      property.onValue(spy1);
      property.onEnd(spy2);
      sinon.assert.calledOnce(spy1.withArgs('lol'));
      sinon.assert.calledOnce(spy2);
    });
  });

  describe('mutating methods', () => {
    it('resolves, but does nothing', function() {
      const $q = this.$inject('$q');
      const path = ['fields', 'field2', 'de-DE'];

      return $q.all(
        mutatingMethods.map(method => {
          return this.doc[method](path, { blah: 'blah' }).then(() => {
            expect(this.doc.getValueAt(path)).toEqual(_.get(data, path));
          });
        })
      );
    });
  });
});
