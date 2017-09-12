import * as C from 'utils/Collections';
import { deepFreeze } from 'utils/Freeze';
import { range } from 'lodash';

describe('utils/Collections', function () {

  describe('.update', function () {
    it('deeply updates collection for array of keys', function () {
      const c = { x: [{}, {z: true}, {}] };
      const c2 = C.update(c, ['x', 1, 'z'], (v) => !v);

      c.x[1].z = false;
      expect(c2).toEqual(c);
    });

    it('updates array for number key', function () {
      const c = [true, false, true];
      const c2 = C.update(c, 1, (v) => !v);

      c[1] = true;
      expect(c2).toEqual(c);
    });

    it('updates object for string key', function () {
      const c = { x: true, y: false, z: true };
      const c2 = C.update(c, 'y', (v) => !v);

      c.y = true;
      expect(c2).toEqual(c);
    });
  });

  describe('.concat', function () {
    it('concats all arguments', function () {
      const arrays = range(5).map((x) => deepFreeze([2 * x, 2 * x + 1]));
      const concatted = C.concat(...arrays);
      const result = range(10);
      expect(concatted).toEqual(result);
    });

    it('throws if argument is not array', function () {
      expect(() => {
        C.concat([], [], 4, []);
      }).toThrowError(TypeError);
    });
  });

});
