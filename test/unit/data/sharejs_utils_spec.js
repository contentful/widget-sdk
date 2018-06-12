'use strict';

describe('data/ShareJS/Utils', () => {
  beforeEach(function () {
    module('contentful/test');
    this.ShareJS = this.$inject('data/ShareJS/Utils');
  });

  describe('#peek', () => {
    test('gets value from the doc', sinon.stub().returns('value'), 'value');
    test('returns undefined if the doc throws', sinon.stub().throws(), undefined);

    function test (doesWhat, stub, expected) {
      it(doesWhat, function () {
        const doc = {getAt: stub};
        const val = this.ShareJS.peek(doc, ['a']);
        expect(val === expected).toBe(true);
        sinon.assert.calledOnce(doc.getAt.withArgs(['a']));
      });
    }
  });

  describe('#remove', () => {
    test('removes value from the doc', sinon.stub().callsArg(1));
    test('ignores errors thrown by the doc', sinon.stub().throws());

    function test (doesWhat, stub) {
      it(doesWhat, function () {
        const success = sinon.spy();
        const doc = {removeAt: stub};
        this.ShareJS.remove(doc, ['a']).then(success);
        sinon.assert.calledOnce(doc.removeAt.withArgs(['a']));
        this.$apply();
        sinon.assert.calledOnce(success);
      });
    }
  });

  describe('#setDeep()', () => {
    beforeEach(function () {
      const OtDocMock = this.$inject('mocks/OtDoc');
      this.doc = new OtDocMock();
      this.setDeep = this.ShareJS.setDeep;
    });

    it('overwrites existing value', function () {
      this.doc.snapshot = {a: {b: 'VAL'}};
      this.setDeep(this.doc, ['a', 'b'], 'NEW');
      expect(this.doc.snapshot.a.b).toEqual('NEW');
    });

    it('keeps values in intermediate containers', function () {
      const intermediate = {x: 'VAL'};
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

    describe('does not update if new value equals old one', () => {
      it('for primitives', function () {
        this.doc.snapshot.a = 'VALUE';
        sinon.spy(this.doc, 'setAt');
        this.setDeep(this.doc, ['a'], 'VALUE');
        sinon.assert.notCalled(this.doc.set);
      });

      it('for references', function () {
        this.doc.snapshot.a = ['some', 'array'];
        sinon.spy(this.doc, 'setAt');
        this.setDeep(this.doc, ['a'], ['some', 'array']);
        sinon.assert.notCalled(this.doc.set);
      });
    });

    it('removes value if undefined is given', function () {
      this.doc.snapshot.a = 'abc';
      this.setDeep(this.doc, ['a'], undefined);
      sinon.assert.calledOnce(this.doc.removeAt.withArgs(['a']));
      sinon.assert.notCalled(this.doc.set);
    });

    it('resolves the promise', function () {
      const success = sinon.stub();
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
