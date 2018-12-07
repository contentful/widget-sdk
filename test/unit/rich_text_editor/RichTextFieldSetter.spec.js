import { get } from 'lodash';
import * as sinon from 'test/helpers/sinon';

describe('RichTextFieldSetter', () => {
  beforeEach(function() {
    this.ShareJS = {
      peek: (doc, filePath) => get(doc.snapshot, filePath),
      setDeep: sinon.stub().resolves()
    };
    this.logger = {
      logException: sinon.spy()
    };
    this.emptyDoc = { content: [{}], nodeType: 'document' };

    module('contentful/test', $provide => {
      $provide.value('data/ShareJS/Utils', this.ShareJS);
      $provide.value('logger', this.logger);
      $provide.value('app/widgets/rich_text/constants/EmptyDoc.es6', {
        default: this.emptyDoc
      });
    });

    this.RichTextFieldSetter = this.$inject('app/widgets/rich_text/RichTextFieldSetter.es6');
    this.OtDoc = this.$inject('mocks/OtDoc');
  });

  describe('#is()', function() {
    it('returns true if fieldId is of type `RichText`', function() {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'RichText' }]
      };
      expect(this.RichTextFieldSetter.is(fieldId, ct)).toBeTruthy();
    });

    it('returns true if fieldId is of type `RichText`', function() {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'RichText' }]
      };
      expect(this.RichTextFieldSetter.is(fieldId, ct)).toBeTruthy();
    });

    it('returns false if fieldId is not of type `RichText`', function() {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'Symbol' }]
      };
      expect(this.RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });

    it('returns false if contentType has no field with id `fieldId`', function() {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: 'cba', type: 'RichText' }]
      };
      expect(this.RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });

    it('returns false if contentType has no field with id `fieldId`', function() {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: 'cba', type: 'RichText' }]
      };
      expect(this.RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });

    it('returns false if the contentType is not passed', function() {
      const fieldId = 'abc';
      expect(this.RichTextFieldSetter.is(fieldId)).toBeFalsy();
    });
  });

  describe('#setAt()', function() {
    it('initializes new documents with default value', function() {
      const doc = {
        submitOp: sinon.spy(),
        snapshot: []
      };
      const fieldPath = ['fields', 'id', 'locale'];
      const nextValue = {};
      this.RichTextFieldSetter.setAt(doc, fieldPath, nextValue).then(() => {
        sinon.assert.called(doc.submitOp);
        sinon.assert.calledWith(this.ShareJS.setDeep, doc, fieldPath, this.emptyDoc);
      });
    });

    it('sends changes as OT operations', function() {
      const testOps = [
        {
          value: { content: [{ value: 'hello ' }] },
          nextValue: { content: [{ value: 'hello world' }] },
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'value', 6],
              si: 'world'
            }
          ]
        },
        {
          value: { content: [{ value: 'hello world' }] },
          nextValue: { content: [{ value: 'hello' }] },
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'value', 5],
              sd: ' world'
            }
          ]
        },
        {
          value: { content: [{ value: 'hello world' }] },
          nextValue: {
            content: [{ value: 'hello ' }, { value: 'world', marks: [{ type: 'bold' }] }]
          },
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'value', 6],
              sd: 'world'
            },
            {
              p: ['fields', 'id', 'locale', 'content', 1],
              li: { value: 'world', marks: [{ type: 'bold' }] }
            }
          ]
        }
      ];
      const fieldPath = ['fields', 'id', 'locale'];

      testOps.forEach(({ value, nextValue, ops }) => {
        const doc = new this.OtDoc({
          fields: {
            id: {
              locale: value
            }
          }
        });
        this.RichTextFieldSetter.setAt(doc, fieldPath, nextValue);

        sinon.assert.notCalled(this.ShareJS.setDeep);
        sinon.assert.calledWith(doc.submitOp, sinon.match(ops));
      });
    });
  });
});
