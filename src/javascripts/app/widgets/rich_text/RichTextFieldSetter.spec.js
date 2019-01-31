import { BLOCKS } from '@contentful/rich-text-types';
import * as RichTextFieldSetter from './RichTextFieldSetter.es6';
import emptyDoc from './constants/EmptyDoc.es6';
import { document, block, mark, text } from './helpers/nodeFactory.es6';

const mocks = {
  ShareJS: {
    setDeep: jest.fn().mockResolvedValue(),
    peek: jest.fn()
  }
};

jest.mock(
  'ng/data/ShareJS/Utils',
  () => ({
    setDeep: (...args) => mocks.ShareJS.setDeep(...args),
    peek: (...args) => mocks.ShareJS.peek(...args)
  }),
  { virtual: true }
);

describe('RichTextFieldSetter', () => {
  describe('#is()', () => {
    it('returns true if fieldId is of type `RichText`', () => {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'RichText' }]
      };
      expect(RichTextFieldSetter.is(fieldId, ct)).toBeTruthy();
    });

    it('returns false if fieldId is not of type `RichText`', () => {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'Symbol' }]
      };
      expect(RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });

    it('returns false if contentType has no field with id `fieldId`', () => {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: 'cba', type: 'RichText' }]
      };
      expect(RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });
  });

  describe('#setAt()', () => {
    it('initializes new documents with the default "empty document" value', async () => {
      const doc = {
        submitOp: jest.fn().mockImplementationOnce((_ops, cb) => cb())
      };
      const fieldPath = ['fields', 'id', 'locale'];
      const nextValue = {};
      mocks.ShareJS.peek.mockReturnValueOnce(undefined);

      await RichTextFieldSetter.setAt(doc, fieldPath, nextValue);

      expect(mocks.ShareJS.setDeep).toBeCalledWith(doc, fieldPath, emptyDoc);
    });

    it('resets empty documents to `undefined`', async () => {
      const doc = {
        submitOp: jest.fn().mockImplementationOnce((_ops, cb) => cb())
      };
      mocks.ShareJS.peek.mockReturnValueOnce(emptyDoc);

      const fieldPath = ['fields', 'id', 'locale'];
      const nextValue = emptyDoc;

      await RichTextFieldSetter.setAt(doc, fieldPath, nextValue);

      expect(mocks.ShareJS.setDeep).toBeCalledWith(doc, fieldPath, undefined);
      expect(doc.submitOp).toBeCalledTimes(1);
      expect(doc.submitOp).toBeCalledWith([], expect.any(Function));
    });

    it('sends changes as OT operations', async function() {
      const testOps = [
        {
          value: document(block(BLOCKS.PARAGRAPH, {}, text('hello '))),
          nextValue: document(block(BLOCKS.PARAGRAPH, {}, text('hello world'))),
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 0, 'value'],
              od: 'hello ',
              oi: 'hello world'
            }
          ]
        },
        {
          value: document(block(BLOCKS.PARAGRAPH, {}, text('hello world'))),
          nextValue: document(block(BLOCKS.PARAGRAPH, {}, text('hello'))),
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 0, 'value'],
              od: 'hello world',
              oi: 'hello'
            }
          ]
        },
        {
          value: document(block(BLOCKS.PARAGRAPH, {}, text('hello world'))),
          nextValue: document(
            block(BLOCKS.PARAGRAPH, {}, text('hello '), text('world', [mark('bold')]))
          ),
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 0, 'value'],
              od: 'hello world',
              oi: 'hello '
            },
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 1],
              li: { data: {}, nodeType: 'text', value: 'world', marks: [{ type: 'bold' }] }
            }
          ]
        }
      ];
      const fieldPath = ['fields', 'id', 'locale'];

      for await (const { value, nextValue, ops } of testOps) {
        const doc = {
          submitOp: jest.fn().mockImplementationOnce((_ops, cb) => cb())
        };
        mocks.ShareJS.setDeep.mockClear();
        mocks.ShareJS.peek.mockReturnValueOnce(value);

        await RichTextFieldSetter.setAt(doc, fieldPath, nextValue);

        expect(mocks.ShareJS.setDeep).not.toHaveBeenCalled();
        expect(doc.submitOp).toBeCalledWith(ops, expect.any(Function));
      }
    });
  });
});
