'use strict';

describe('ShareJS', function () {
  var ShareJS, ShareJSClient;

  beforeEach(function () {
    ShareJSClient = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('ShareJS/Client', ShareJSClient);
    });
    ShareJS = this.$inject('ShareJS');
  });

  describe('#connect()', function () {
    it('creates client for given token', function () {
      ShareJS.connect('TOKEN');
      sinon.assert.calledOnce(ShareJSClient);
      var clientToken = ShareJSClient.args[0][1];
      expect(clientToken).toEqual('TOKEN');
    });

    it('throws when called twice', function () {
      ShareJS.connect('TOKEN');
      expect(ShareJS.connect).toThrow();
    });
  });

  describe('#open()', function () {
    it('calls client.open() when connected', function () {
      var client = {open: sinon.stub()};
      ShareJSClient.returns(client);
      ShareJS.connect('TOKEN');
      ShareJS.open('ENTITY');
      sinon.assert.calledOnce(client.open);
      sinon.assert.calledWithExactly(client.open, 'ENTITY');
    });
  });

  describe('#setDeep()', function () {

    beforeEach(function () {
      var OtDocMock = this.$inject('mocks/OtDoc');
      this.doc = new OtDocMock();
    });

    it('overwrites existing value', function () {
      this.doc.snapshot = {a: {b: 'VAL'}};
      ShareJS.setDeep(this.doc, ['a', 'b'], 'NEW');
      expect(this.doc.snapshot.a.b).toEqual('NEW');
    });

    it('keeps values in intermediate containers', function () {
      var intermediate = {x: 'VAL'};
      this.doc.snapshot = {i: intermediate};
      ShareJS.setDeep(this.doc, ['i', 'a', 'b'], 'NEW');
      expect(this.doc.snapshot.i).toBe(intermediate);
      expect(this.doc.snapshot.i.x).toEqual('VAL');
      expect(this.doc.snapshot.i.a.b).toEqual('NEW');
    });

    it('creates intermediate containers', function () {
      ShareJS.setDeep(this.doc, ['a', 'b'], 'VAL');
      expect(_.isObject(this.doc.snapshot.a)).toBe(true);
    });

    it('sets deep value intermediate containers', function () {
      ShareJS.setDeep(this.doc, ['a', 'b', 'c'], 'VAL');
      expect(this.doc.snapshot.a.b.c).toBe('VAL');
    });

    it('does not update if new value equals old one', function () {
      this.doc.snapshot.a = 'VALUE';
      sinon.spy(this.doc, 'setAt');
      ShareJS.setDeep(this.doc, ['a'], 'VALUE');
      sinon.assert.notCalled(this.doc.set);
    });

    it('resolves the promise', function () {
      var success = sinon.stub();
      ShareJS.setDeep(this.doc, ['a', 'b'], 'VAL').then(success);
      this.$apply();
      sinon.assert.calledOnce(success);

      success.reset();
      ShareJS.setDeep(this.doc, ['a', 'b'], 'NEW').then(success);
      this.$apply();
      sinon.assert.calledOnce(success);

      success.reset();
      ShareJS.setDeep(this.doc, ['a', 'b'], 'NEW').then(success);
      this.$apply();
      sinon.assert.calledOnce(success);
    });
  });
});
