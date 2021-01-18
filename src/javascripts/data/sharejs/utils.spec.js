import _ from 'lodash';
import * as ShareJS from './utils';
import ShareJsDocMock from 'app/entity_editor/Document/__mocks__/ShareJsDocMock';

const OtDocMock = ShareJsDocMock();

describe('data/ShareJS/Utils', () => {
  describe('#peek', () => {
    function testPeek(doesWhat, stub, expected) {
      it(doesWhat, function () {
        const doc = { getAt: stub };
        const val = ShareJS.peek(doc, ['a']);
        expect(val === expected).toBe(true);
        expect(doc.getAt).toHaveBeenCalledWith(['a']);
      });
    }

    testPeek('gets value from the doc', jest.fn().mockReturnValue('value'), 'value');
    testPeek(
      'returns undefined if the doc throws',
      jest.fn().mockImplementation(() => {
        throw new Error('');
      }),
      undefined
    );
  });

  describe('#remove', () => {
    it('removes value from the doc', async () => {
      const doc = new OtDocMock();
      const removeAtSpy = jest.spyOn(doc, 'removeAt');
      await expect(ShareJS.remove(doc, ['a'])).resolves.toBeUndefined();
      expect(removeAtSpy).toHaveBeenCalledTimes(1);
      expect(removeAtSpy).toHaveBeenCalledWith(['a'], expect.any(Function));
      removeAtSpy.mockClear();
    });

    it('ignores errors thrown by the doc', async () => {
      const doc = new OtDocMock();
      doc.removeAt = () => {
        throw new Error('');
      };
      await expect(ShareJS.remove(doc, ['a'])).resolves.toBeUndefined();
    });
  });

  describe('#setDeep()', () => {
    it('overwrites existing value', function () {
      const doc = new OtDocMock();
      doc.snapshot = { a: { b: 'VAL' } };

      ShareJS.setDeep(doc, ['a', 'b'], 'NEW');
      expect(doc.snapshot.a.b).toEqual('NEW');
    });

    it('keeps values in intermediate containers', function () {
      const doc = new OtDocMock();
      const intermediate = { x: 'VAL' };
      doc.snapshot = { i: intermediate };
      ShareJS.setDeep(doc, ['i', 'a', 'b'], 'NEW');
      expect(doc.snapshot.i).toBe(intermediate);
      expect(doc.snapshot.i.x).toEqual('VAL');
      expect(doc.snapshot.i.a.b).toEqual('NEW');
    });

    it('creates intermediate containers', function () {
      const doc = new OtDocMock();
      ShareJS.setDeep(doc, ['a', 'b'], 'VAL');
      expect(_.isObject(doc.snapshot.a)).toBe(true);
    });

    it('sets deep value intermediate containers', function () {
      const doc = new OtDocMock();
      ShareJS.setDeep(doc, ['a', 'b', 'c'], 'VAL');
      expect(doc.snapshot.a.b.c).toBe('VAL');
    });

    describe('does not update if new value equals old one', () => {
      it('for primitives', function () {
        const doc = new OtDocMock();
        doc.snapshot.a = 'VALUE';
        jest.spyOn(doc, 'setAt');
        ShareJS.setDeep(doc, ['a'], 'VALUE');
        expect(doc.set).not.toHaveBeenCalled();
      });

      it('for references', function () {
        const doc = new OtDocMock();
        doc.snapshot.a = ['some', 'array'];
        jest.spyOn(doc, 'setAt');
        ShareJS.setDeep(doc, ['a'], ['some', 'array']);
        expect(doc.set).not.toHaveBeenCalled();
      });
    });

    it('removes value if undefined is given', function () {
      const doc = new OtDocMock();
      const removeAtSpy = jest.spyOn(doc, 'removeAt');
      const setSpy = jest.spyOn(doc, 'set');
      doc.snapshot.a = 'abc';
      ShareJS.setDeep(doc, ['a'], undefined);
      expect(removeAtSpy).toHaveBeenCalledTimes(1);
      expect(removeAtSpy).toHaveBeenCalledWith(['a'], expect.any(Function));
      expect(setSpy).toHaveBeenCalledTimes(0);
      removeAtSpy.mockClear();
      setSpy.mockClear();
    });
  });
});
