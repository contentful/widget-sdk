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

  describe('#mkpathAndSetValue', function () {

    beforeEach(function () {
      this.mkpathAndSetValue = ShareJS.mkpathAndSetValue;
      var self = this;
      this.getValues = [];
      this.at = sinon.spy(function () { return self.doc; });
      this.set = sinon.stub().yields();
      this.get = sinon.spy(function () { return self.getValues.shift(); });
      this.doc = {
        at: this.at,
        set: this.set,
        get: this.get
      };

      this.callback = sinon.stub();
    });

    it('should create a top level property', function () {
      this.mkpathAndSetValue(this.doc, ['field'], 'content');
      expect(this.at.args).toMatchMultipleCallsArgs(['field']);
      expect(this.set.calledWith('content')).toBe(true);
    });


    it('resolves the promise when value is set', function () {
      var success = sinon.stub();
      this.mkpathAndSetValue(this.doc, ['field'], 'content')
      .then(success);
      this.$apply();
      sinon.assert.calledOnce(success);
    });

    it('should create a nested property', function () {
      this.mkpathAndSetValue(this.doc, ['field', 'subfield'], 'content');
      expect(this.at.args).toMatchMultipleCallsArgs(['field']);
      expect(this.set.calledWith({subfield: 'content'})).toBe(true);
    });

    it('creates a property in an existing document', function () {
      this.getValues.push({});
      this.mkpathAndSetValue(this.doc, ['field', 'property'], 'content');
      expect(this.at.args).toMatchMultipleCallsArgs(['field', 'property']);
      expect(this.set.calledWith('content')).toBe(true);
    });

    it('creates an array with one document in an existing collection of documents', function () {
      var doc = { fields: [{}] };
      this.getValues.push(doc, doc.fields);
      var path = ['doc', 'fields', 1, 'document'];
      this.mkpathAndSetValue(this.doc, path, 'content');
      expect(this.at.args).toMatchMultipleCallsArgs(['doc', 'fields', 1]);
      expect(this.set.calledWith({document: 'content'})).toBe(true);
    });

    it('creates a string where path exists and is string', function () {
      this.getValues.push('herp derp');
      this.mkpathAndSetValue(this.doc, ['prop'], 'content');
      expect(this.at.args).toMatchMultipleCallsArgs(['prop']);
      expect(this.set.called).toBe(false);
    });

    it('creates a string where path exists and is null', function () {
      this.getValues.push(null);
      this.mkpathAndSetValue(this.doc, ['prop'], 'content');
      expect(this.at.args).toMatchMultipleCallsArgs(['prop']);
      expect(this.set.calledWith('content')).toBe(true);
    });

    it('creates an object where path exists and is array', function () {
      this.getValues.push({prop: []}, []);
      this.mkpathAndSetValue(this.doc, ['prop', 'drop'], {foo: 'bar'});
      expect(this.at.args).toMatchMultipleCallsArgs(['prop', 'drop']);
      expect(this.set.calledWith({foo: 'bar'})).toBe(true);
    });

    it('creates an object where path exists and is array', function () {
      this.getValues = [null];
      this.mkpathAndSetValue(this.doc, ['container', 'prop'], true);
      expect(this.at.args).toMatchMultipleCallsArgs(['container']);
      sinon.assert.calledWith(this.set, {prop: true});
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
      this.doc.snapshot.a = 'OLD';
      sinon.spy(this.doc, 'setAt');

      ShareJS.setDeep(this.doc, ['a'], 'NEW');
      sinon.assert.calledOnce(this.doc.setAt);

      ShareJS.setDeep(this.doc, ['a'], 'NEW');
      sinon.assert.calledOnce(this.doc.setAt);
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
