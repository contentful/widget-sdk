'use strict';

describe('data/ShareJS/Utils', function () {
  beforeEach(function () {
    module('contentful/test');
  });

  describe('#setDeep()', function () {
    beforeEach(function () {
      var OtDocMock = this.$inject('mocks/OtDoc');
      this.doc = new OtDocMock();
      this.setDeep = this.$inject('data/ShareJS/Utils').setDeep;
    });

    it('overwrites existing value', function () {
      this.doc.snapshot = {a: {b: 'VAL'}};
      this.setDeep(this.doc, ['a', 'b'], 'NEW');
      expect(this.doc.snapshot.a.b).toEqual('NEW');
    });

    it('keeps values in intermediate containers', function () {
      var intermediate = {x: 'VAL'};
      this.doc.snapshot = {i: intermediate};
      this.setDeep(this.doc, ['i', 'a', 'b'], 'NEW');
      expect(this.doc.snapshot.i).toBe(intermediate);
      expect(this.doc.snapshot.i.x).toEqual('VAL');
      expect(this.doc.snapshot.i.a.b).toEqual('NEW');
    });

    it('creates intermediate containers', function () {
      this.setDeep(this.doc, ['a', 'b'], 'VAL');
      expect(_.isObject(this.doc.snapshot.a)).toBe(true);
    });

    it('sets deep value intermediate containers', function () {
      this.setDeep(this.doc, ['a', 'b', 'c'], 'VAL');
      expect(this.doc.snapshot.a.b.c).toBe('VAL');
    });

    it('does not update if new value equals old one', function () {
      this.doc.snapshot.a = 'VALUE';
      sinon.spy(this.doc, 'setAt');
      this.setDeep(this.doc, ['a'], 'VALUE');
      sinon.assert.notCalled(this.doc.set);
    });

    it('resolves the promise', function () {
      var success = sinon.stub();
      this.setDeep(this.doc, ['a', 'b'], 'VAL').then(success);
      this.$apply();
      sinon.assert.calledOnce(success);

      success.reset();
      this.setDeep(this.doc, ['a', 'b'], 'NEW').then(success);
      this.$apply();
      sinon.assert.calledOnce(success);

      success.reset();
      this.setDeep(this.doc, ['a', 'b'], 'NEW').then(success);
      this.$apply();
      sinon.assert.calledOnce(success);
    });
  });
});
