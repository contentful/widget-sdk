'use strict';

describe('ShareJS static methods', function () {
  beforeEach(function () {
    module('contentful/test');
    this.ShareJS = this.$inject('ShareJS');
    var self = this;
    this.getValues = [];
    this.at  = sinon.spy(function () { return self.doc;  });
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
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['field'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['field']);
    expect(this.set.calledWith('content', this.callback)).toBe(true);
  });


  it('should create a nested property', function () {
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['field', 'subfield'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['field']);
    expect(this.set.calledWith({subfield: 'content'}, this.callback)).toBe(true);
  });

  it('create an array with one document', function () {
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['fields', 0, 'document'],
      types: ['Array', 'Object', 'String'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['fields']);
    expect(this.set.calledWith([{document: 'content'}], this.callback)).toBe(true);
  });

  it('create a property in an existing document', function () {
    this.getValues.push({});
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['field', 'property'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['field', 'property']);
    expect(this.set.calledWith('content', this.callback)).toBe(true);
  });

  it('create a property in an existing collection', function () {
    this.getValues.push([]);
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['fields', 0],
      types: ['Array', 'String'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['fields', 0]);
    expect(this.set.calledWith('content', this.callback)).toBe(true);
  });

  it('create a document in an existing collection of documents', function () {
    var doc = {};
    this.getValues.push([doc], doc);
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['fields', 0, 'property'],
      types: ['Array', 'Object', 'String'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['fields', 0, 'property']);
    expect(this.set.calledWith('content', this.callback)).toBe(true);
  });

  it('create an array with one document in an existing collection of documents', function () {
    var doc = { fields: [{}] };
    this.getValues.push(doc, doc.fields);
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['doc', 'fields', 1, 'document'],
      types: ['Object', 'Array', 'Object', 'String'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['doc', 'fields', 1]);
    expect(this.set.calledWith({document: 'content'}, this.callback)).toBe(true);
  });

  it('create a string where path exists and is string', function (done) {
    this.getValues.push('herp derp');
    this.callback = function () { done(); };
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['prop'],
      types: ['String'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['prop']);
    expect(this.set.called).toBe(false);
  });

  it('create a string where path exists and is null', function () {
    this.getValues.push(null);
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['prop'],
      types: ['String'],
      value: 'content'
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['prop']);
    expect(this.set.calledWith('content', this.callback)).toBe(true);
  });

  it('create an object where path exists and is array', function () {
    this.getValues.push({prop: []}, []);
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['prop', 'drop'],
      types: ['Object', 'Object'],
      value: {foo: 'bar'}
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['prop', 'drop']);
    expect(this.set.calledWith({foo: 'bar'}, this.callback)).toBe(true);
  });

  it('create an object where path exists and is array', function () {
    this.getValues = [null];
    this.ShareJS.mkpathAndSetValue({
      doc: this.doc,
      path: ['container', 'prop'],
      value: true
    }, this.callback);
    expect(this.at.args).toMatchMultipleCallsArgs(['container']);
    sinon.assert.calledWith(this.set, {prop: true}, this.callback);
  });
});
