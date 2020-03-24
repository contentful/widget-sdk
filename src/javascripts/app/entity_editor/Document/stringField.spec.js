import _ from 'lodash';
import * as ShareJS from 'data/sharejs/utils';
import * as StringField from './stringField';

jest.mock('data/sharejs/utils', () => ({
  setDeep: jest.fn().mockResolvedValue(),
  peek: jest.fn().mockReturnValue(undefined)
}));

describe('entity_editor/Document/stringField', () => {
  beforeEach(() => {
    ShareJS.peek.mockClear();
    ShareJS.setDeep.mockClear();
  });

  describe('#isStringField', () => {
    function ctWithFields(fields) {
      return { data: { fields } };
    }

    it('returns true for Symbol/Text field', function() {
      ['Symbol', 'Text'].forEach(type => {
        const fields = [{ id: 'x', type: 'Boolean' }, { id: 'fid', type }];
        expect(StringField.isStringField('fid', ctWithFields(fields))).toBe(true);
      });
    });

    it('returns false for any other field type', function() {
      ['Boolean', 'Location', 'Date', 'Object', 'RichText', 'Entry', 'Asset'].forEach(type => {
        const fields = [{ id: 'x', type: 'Boolean' }, { id: 'fid', type }];
        expect(StringField.isStringField('fid', ctWithFields(fields))).toBe(false);
      });
    });

    it('returns false for an unknown field', function() {
      expect(StringField.isStringField('fid', null)).toBe(false);
      expect(StringField.isStringField('fid', {})).toBe(false);
      expect(StringField.isStringField('fid', { data: null })).toBe(false);
      expect(StringField.isStringField('fid', ctWithFields(null))).toBe(false);
      expect(StringField.isStringField('fid', ctWithFields([{ id: 'other', type: 'Text' }]))).toBe(
        false
      );
      expect(StringField.isStringField('fid', ctWithFields([{ id: 'fid', type: 'Text' }]))).toBe(
        true
      );
    });
  });

  describe('#setAt', () => {
    const path = ['some', 'path'];

    describe('setting invalid values', () => {
      function testInvalid(type, value) {
        it(`rejects when setting the value to: ${type}`, function(done) {
          const submitOp = jest.fn().mockResolvedValue();
          const doc = { submitOp: submitOp };

          const setAt = value => {
            return StringField.setAt(doc, path, value);
          };

          return setAt(value).then(_.noop, err => {
            expect(err.message).toBe('Invalid string field value.');
            done();
          });
        });
      }

      testInvalid('object', {});
      testInvalid('array', []);
      testInvalid('nan', NaN);
      testInvalid('date', new Date());
    });

    function init(from, to) {
      const submitOp = jest.fn().mockResolvedValue();
      const doc = { submitOp: submitOp };

      const setAt = value => {
        return StringField.setAt(doc, path, value);
      };

      ShareJS.peek.mockReturnValue(from);
      setAt(to);
      expect(ShareJS.peek).toHaveBeenCalledWith(doc, path);

      return {
        assertSet: value => {
          expect(ShareJS.setDeep).toHaveBeenCalledWith(doc, path, value);
        },
        assertNotSet: () => {
          expect(ShareJS.setDeep).not.toHaveBeenCalled();
        },
        assertNotSubmit: () => {
          expect(submitOp).not.toHaveBeenCalled();
        },
        assertSubmit: ops => {
          expect(submitOp).toHaveBeenCalledWith(ops, expect.any(Function));
        }
      };
    }

    describe('setting an empty string', () => {
      it('cur: undef, next: empty -> do nothing', function() {
        const { assertNotSet, assertNotSubmit } = init(undefined, '');
        assertNotSet();
        assertNotSubmit();
      });

      it('cur: null, next: empty -> set undefined', function() {
        const { assertSet, assertNotSubmit } = init(null, '');
        assertSet(undefined);
        assertNotSubmit();
      });

      it('cur: empty, next: empty -> set undefined', function() {
        const { assertSet, assertNotSubmit } = init('', '');
        assertSet(undefined);
        assertNotSubmit();
      });

      it('cur: string, next: empty -> set undefined', function() {
        const { assertSet, assertNotSubmit } = init('abc', '');
        assertSet(undefined);
        assertNotSubmit();
      });
    });

    describe('setting undef/nil values', () => {
      it('cur: null, next: undef -> set undef', function() {
        const { assertSet, assertNotSubmit } = init(null, undefined);
        assertSet(undefined);
        assertNotSubmit();
      });

      it('cur: string, next: undef -> set undef', function() {
        const { assertSet, assertNotSubmit } = init('abc', undefined);
        assertSet(undefined);
        assertNotSubmit();
      });

      it('cur: empty, next: undef -> set undef', function() {
        const { assertSet, assertNotSubmit } = init('', undefined);
        assertSet(undefined);
        assertNotSubmit();
      });

      it('cur: string, next: null -> set null', function() {
        const { assertSet, assertNotSubmit } = init('abc', null);
        assertSet(null);
        assertNotSubmit();
      });
    });

    describe('patching', () => {
      it('cur: empty, next: string -> insert patch', function() {
        const { assertSubmit } = init('', 'abc');
        assertSubmit([{ p: path.concat([0]), si: 'abc' }]);
      });

      it('cur: string, next: cur+string -> insert patch', function() {
        const { assertSubmit } = init('abc', 'abcd');
        assertSubmit([{ p: path.concat([3]), si: 'd' }]);
      });

      it('cur: string, next: different string -> delete-insert patch', function() {
        const { assertSubmit } = init('abc', 'abX');
        assertSubmit([{ p: path.concat([2]), sd: 'c' }, { p: path.concat([2]), si: 'X' }]);
      });
    });
  });
});
