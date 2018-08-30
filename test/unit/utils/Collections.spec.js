import * as C from 'utils/Collections.es6';
import { deepFreeze } from 'utils/Freeze.es6';
import { range } from 'lodash';

describe('utils/Collections.es6', () => {
  describe('.update', () => {
    it('deeply updates collection for array of keys', () => {
      const c = { x: [{}, { z: true }, {}] };
      const c2 = C.update(c, ['x', 1, 'z'], v => !v);

      c.x[1].z = false;
      expect(c2).toEqual(c);
    });

    it('updates array for number key', () => {
      const c = [true, false, true];
      const c2 = C.update(c, 1, v => !v);

      c[1] = true;
      expect(c2).toEqual(c);
    });

    it('updates object for string key', () => {
      const c = { x: true, y: false, z: true };
      const c2 = C.update(c, 'y', v => !v);

      c.y = true;
      expect(c2).toEqual(c);
    });
  });

  describe('.concat', () => {
    it('concats all arguments', () => {
      const arrays = range(5).map(x => deepFreeze([2 * x, 2 * x + 1]));
      const concatted = C.concat(...arrays);
      const result = range(10);
      expect(concatted).toEqual(result);
    });

    it('throws if argument is not array', () => {
      expect(() => {
        C.concat([], [], 4, []);
      }).toThrowError(TypeError);
    });
  });

  describe('.move', () => {
    it('returns the same array if indexes are equal', () => {
      const arr = [1, 2, 3];
      expect(C.move(arr, 1, 1)).toBe(arr);
    });

    it('moves an element', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(C.move(arr, 0, 4)).toEqual([2, 3, 4, 5, 1]);
      expect(C.move(arr, 4, 0)).toEqual([5, 1, 2, 3, 4]);
      expect(C.move(arr, 1, 3)).toEqual([1, 3, 4, 2, 5]);
      expect(C.move(arr, 3, 1)).toEqual([1, 4, 2, 3, 5]);
    });

    it('throws for invalid input', () => {
      expect(() => C.move({})).toThrowError(TypeError);
      expect(() => C.move([1, 2], -1, 1)).toThrowError(TypeError);
      expect(() => C.move([1, 2, 3], 1, 100)).toThrowError(TypeError);
    });
  });
});
