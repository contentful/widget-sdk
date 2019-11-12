import _ from 'lodash';
import * as ShareJS from './utils';
import sinon from 'sinon';
import createOtDocMock from '../../../../test/helpers/mocks/ot_doc';

const OtDocMock = createOtDocMock();

describe('data/ShareJS/Utils', () => {
  describe('#peek', () => {
    function testPeek(doesWhat, stub, expected) {
      it(doesWhat, function() {
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
    function testRemove(doesWhat, stub) {
      it(doesWhat, async function() {
        const doc = { removeAt: stub };
        await ShareJS.remove(doc, ['a']);
        expect(doc.removeAt).toHaveBeenCalledTimes(1);
        expect(doc.removeAt).toHaveBeenCalledWith(['a'], expect.any(Function));
      });
    }

    testRemove('removes value from the doc', jest.fn());
    testRemove(
      'ignores errors thrown by the doc',
      jest.fn().mockImplementation(() => {
        throw new Error('');
      })
    );
  });

  describe('#setDeep()', () => {
    it('overwrites existing value', function() {
      const doc = new OtDocMock();
      doc.snapshot = { a: { b: 'VAL' } };

      ShareJS.setDeep(doc, ['a', 'b'], 'NEW');
      expect(doc.snapshot.a.b).toEqual('NEW');
    });

    it('keeps values in intermediate containers', function() {
      const doc = new OtDocMock();
      const intermediate = { x: 'VAL' };
      doc.snapshot = { i: intermediate };
      ShareJS.setDeep(doc, ['i', 'a', 'b'], 'NEW');
      expect(doc.snapshot.i).toBe(intermediate);
      expect(doc.snapshot.i.x).toEqual('VAL');
      expect(doc.snapshot.i.a.b).toEqual('NEW');
    });

    it('creates intermediate containers', function() {
      const doc = new OtDocMock();
      ShareJS.setDeep(doc, ['a', 'b'], 'VAL');
      expect(_.isObject(doc.snapshot.a)).toBe(true);
    });

    it('sets deep value intermediate containers', function() {
      const doc = new OtDocMock();
      ShareJS.setDeep(doc, ['a', 'b', 'c'], 'VAL');
      expect(doc.snapshot.a.b.c).toBe('VAL');
    });

    describe('does not update if new value equals old one', () => {
      it('for primitives', function() {
        const doc = new OtDocMock();
        doc.snapshot.a = 'VALUE';
        sinon.spy(doc, 'setAt'); // eslint-disable-line
        ShareJS.setDeep(doc, ['a'], 'VALUE');
        sinon.assert.notCalled(doc.set); // eslint-disable-line
      });

      it('for references', function() {
        const doc = new OtDocMock();
        doc.snapshot.a = ['some', 'array'];
        sinon.spy(doc, 'setAt'); // eslint-disable-line
        ShareJS.setDeep(doc, ['a'], ['some', 'array']);
        sinon.assert.notCalled(doc.set); // eslint-disable-line
      });
    });

    it('removes value if undefined is given', function() {
      const doc = new OtDocMock();
      doc.snapshot.a = 'abc';
      ShareJS.setDeep(doc, ['a'], undefined);
      sinon.assert.calledOnce(doc.removeAt.withArgs(['a'])); // eslint-disable-line
      sinon.assert.notCalled(doc.set); // eslint-disable-line
    });
  });
});
