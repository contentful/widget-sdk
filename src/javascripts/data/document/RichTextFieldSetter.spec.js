import { BLOCKS, EMPTY_DOCUMENT } from '@contentful/rich-text-types';
import * as RichTextFieldSetter from './RichTextFieldSetter';
import { document, block, mark, text } from 'app/widgets/RichText/helpers/nodeFactory';

const mocks = {
  ShareJS: {
    setDeep: jest.fn().mockResolvedValue(),
    peek: jest.fn(),
  },
};

jest.mock('data/sharejs/utils', () => ({
  setDeep: (...args) => mocks.ShareJS.setDeep(...args),
  peek: (...args) => mocks.ShareJS.peek(...args),
}));

describe('RichTextFieldSetter', () => {
  describe('#is()', () => {
    it('returns true if fieldId is of type `RichText`', () => {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'RichText' }],
      };
      expect(RichTextFieldSetter.is(fieldId, ct)).toBeTruthy();
    });

    it('returns false if fieldId is not of type `RichText`', () => {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: fieldId, type: 'Symbol' }],
      };
      expect(RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });

    it('returns false if contentType has no field with id `fieldId`', () => {
      const fieldId = 'abc';
      const ct = {
        fields: [{ id: 'cba', type: 'RichText' }],
      };
      expect(RichTextFieldSetter.is(fieldId, ct)).toBeFalsy();
    });
  });

  describe('#setAt()', () => {
    it('sets values on empty `undefined` documents directly (no ops)', async () => {
      const doc = {
        submitOp: jest.fn(),
      };
      const fieldPath = ['fields', 'id', 'locale'];
      const nextValue = document(block(BLOCKS.PARAGRAPH, {}, text('hello ')));
      mocks.ShareJS.peek.mockReturnValueOnce(undefined);

      await RichTextFieldSetter.setAt(doc, fieldPath, nextValue);

      expect(mocks.ShareJS.setDeep).toBeCalledWith(doc, fieldPath, nextValue);
      expect(doc.submitOp).toBeCalledTimes(0);
    });

    it('resets empty documents directly to `undefined` (no ops)', async () => {
      const doc = {
        submitOp: jest.fn(),
      };
      mocks.ShareJS.peek.mockReturnValueOnce(EMPTY_DOCUMENT);

      const fieldPath = ['fields', 'id', 'locale'];
      const nextValue = EMPTY_DOCUMENT;

      await RichTextFieldSetter.setAt(doc, fieldPath, nextValue);

      expect(mocks.ShareJS.setDeep).toBeCalledWith(doc, fieldPath, undefined);
      expect(doc.submitOp).toBeCalledTimes(0);
    });

    it('sends changes as OT operations', async function () {
      const testOps = [
        {
          value: document(block(BLOCKS.PARAGRAPH, {}, text('hello '))),
          nextValue: document(block(BLOCKS.PARAGRAPH, {}, text('hello world'))),
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 0, 'value'],
              od: 'hello ',
              oi: 'hello world',
            },
          ],
        },
        {
          value: document(block(BLOCKS.PARAGRAPH, {}, text('hello world'))),
          nextValue: document(block(BLOCKS.PARAGRAPH, {}, text('hello'))),
          ops: [
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 0, 'value'],
              od: 'hello world',
              oi: 'hello',
            },
          ],
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
              oi: 'hello ',
            },
            {
              p: ['fields', 'id', 'locale', 'content', 0, 'content', 1],
              li: { data: {}, nodeType: 'text', value: 'world', marks: [{ type: 'bold' }] },
            },
          ],
        },
      ];
      const fieldPath = ['fields', 'id', 'locale'];

      for await (const { value, nextValue, ops } of testOps) {
        const doc = {
          submitOp: jest.fn().mockImplementationOnce((_ops, cb) => cb()),
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
