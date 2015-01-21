'use strict';

describe('ShareJS static methods', function () {
  var ShareJS;
  beforeEach(module('contentful/test'));

  describe('mkpath', function () {
    beforeEach(inject(function (_ShareJS_){
      ShareJS = _ShareJS_;
      jasmine.addMatchers({
        toMatchCalls: function () {
          return {
            compare: function (actual, expected) {
              var firstArgs = _.map(actual, 0);
              var pass = _.isEqual(firstArgs, expected);
              return {
                pass: pass,
                message: pass ? 'Expected arguments '+JSON.stringify(actual)+' not to equal ' + JSON.stringify(expected)
                              : 'Expected arguments '+JSON.stringify(actual)+' to equal ' + JSON.stringify(expected)
              };
            }
          };
        }
      });
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
    }));

    it('should create a top level property', function () {
      ShareJS.mkpath({
        doc: this.doc,
        path: ['field'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['field']);
      expect(this.set.calledWith('content', this.callback)).toBe(true);
    });
    

    it('should create a nested property', function () {
      ShareJS.mkpath({
        doc: this.doc,
        path: ['field', 'subfield'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['field']);
      expect(this.set.calledWith({subfield: 'content'}, this.callback)).toBe(true);
    });

    it('create an array with one document', function () {
      ShareJS.mkpath({
        doc: this.doc,
        path: ['fields', 0, 'document'],
        types: ['Array', 'Object', 'String'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['fields']);
      expect(this.set.calledWith([{document: 'content'}], this.callback)).toBe(true);
    });

    it('create a property in an existing document', function () {
      this.getValues.push({});
      ShareJS.mkpath({
        doc: this.doc,
        path: ['field', 'property'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['field', 'property']);
      expect(this.set.calledWith('content', this.callback)).toBe(true);
    });

    it('create a property in an existing collection', function () {
      this.getValues.push([]);
      ShareJS.mkpath({
        doc: this.doc,
        path: ['fields', 0],
        types: ['Array', 'String'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['fields', 0]);
      expect(this.set.calledWith('content', this.callback)).toBe(true);
    });

    it('create a document in an existing collection of documents', function () {
      var doc = {};
      this.getValues.push([doc], doc);
      ShareJS.mkpath({
        doc: this.doc,
        path: ['fields', 0, 'property'],
        types: ['Array', 'Object', 'String'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['fields', 0, 'property']);
      expect(this.set.calledWith('content', this.callback)).toBe(true);
    });

    it('create an array with one document in an existing collection of documents', function () {
      var doc = { fields: [{}] };
      this.getValues.push(doc, doc.fields);
      ShareJS.mkpath({
        doc: this.doc,
        path: ['doc', 'fields', 1, 'document'],
        types: ['Object', 'Array', 'Object', 'String'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['doc', 'fields', 1]);
      expect(this.set.calledWith({document: 'content'}, this.callback)).toBe(true);
    });

    it('create a string where path exists and is string', function (done) {
      this.getValues.push('herp derp');
      this.callback = function () { done(); };
      ShareJS.mkpath({
        doc: this.doc,
        path: ['prop'],
        types: ['String'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['prop']);
      expect(this.set.called).toBe(false);
    });

    it('create a string where path exists and is null', function () {
      this.getValues.push(null);
      ShareJS.mkpath({
        doc: this.doc,
        path: ['prop'],
        types: ['String'],
        value: 'content'
      }, this.callback);
      expect(this.at.args).toMatchCalls(['prop']);
      expect(this.set.calledWith('content', this.callback)).toBe(true);
    });

    it('create an object where path exists and is array', function () {
      this.getValues.push({prop: []}, []);
      ShareJS.mkpath({
        doc: this.doc,
        path: ['prop', 'drop'],
        types: ['Object', 'Object'],
        value: {foo: 'bar'}
      }, this.callback);
      expect(this.at.args).toMatchCalls(['prop', 'drop']);
      expect(this.set.calledWith({foo: 'bar'}, this.callback)).toBe(true);
    });
  });
});
