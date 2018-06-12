'use strict';

describe('entityEditor/Document/StringField', () => {
  beforeEach(function () {
    this.ShareJS = {};
    module('contentful/test', ($provide) => {
      $provide.value('data/ShareJS/Utils', this.ShareJS);
    });

    this.StringField = this.$inject('entityEditor/Document/StringField');
  });

  describe('#is', () => {
    beforeEach(function () {
      this.is = this.StringField.is;
      this.ctWithFields = (fields) => { return {data: {fields}}; };
    });

    it('returns true for Symbol/Text field', function () {
      ['Symbol', 'Text'].forEach((type) => {
        const fields = [{id: 'x', type: 'Boolean'}, {id: 'fid', type}];
        expect(this.is('fid', this.ctWithFields(fields))).toBe(true);
      });
    });

    it('returns false for any other field type', function () {
      ['Boolean', 'Location', 'Date', 'Object', 'Entry', 'Asset'].forEach((type) => {
        const fields = [{id: 'x', type: 'Boolean'}, {id: 'fid', type}];
        expect(this.is('fid', this.ctWithFields(fields))).toBe(false);
      });
    });

    it('returns false for an unknown field', function () {
      expect(this.is('fid', null)).toBe(false);
      expect(this.is('fid', {})).toBe(false);
      expect(this.is('fid', {data: null})).toBe(false);
      expect(this.is('fid', this.ctWithFields(null))).toBe(false);
      expect(this.is('fid', this.ctWithFields([{id: 'other', type: 'Text'}]))).toBe(false);
      expect(this.is('fid', this.ctWithFields([{id: 'fid', type: 'Text'}]))).toBe(true);
    });
  });

  describe('#setAt', () => {
    beforeEach(function () {
      this.path = ['some', 'path'];
      this.submitOp = sinon.stub().resolves();
      this.doc = {submitOp: this.submitOp};
      this.setDeep = sinon.stub().resolves();
      this.peek = sinon.stub().returns(undefined);
      _.extend(this.ShareJS, {setDeep: this.setDeep, peek: this.peek});

      this.setAt = (value) => {
        return this.StringField.setAt(this.doc, this.path, value);
      };
      this.assertPeek = () => {
        sinon.assert.calledOnce(this.peek.withArgs(this.doc, this.path));
      };
      this.assertSet = (value) => {
        sinon.assert.calledOnce(this.setDeep.withArgs(this.doc, this.path, value));
      };
      this.assertNoSet = () => {
        sinon.assert.notCalled(this.setDeep);
      };
      this.assertNoSubmit = () => {
        sinon.assert.notCalled(this.submitOp);
      };
    });

    describe('setting invalid values', () => {
      test('object', {});
      test('array', []);
      test('nan', NaN);
      test('date', new Date());

      function test (type, value) {
        it(`rejects when setting the value to: ${type}`, function () {
          return this.setAt(value).then(_.noop, err => {
            expect(err.message).toBe('Invalid string field value.');
          });
        });
      }
    });

    describe('setting an empty string', () => {
      beforeEach(function () {
        this.init = (from, to) => {
          this.peek.returns(from);
          this.setAt(to);
          this.assertPeek();
          this.assertNoSubmit();
        };
      });

      it('cur: undef, next: empty -> do nothing', function () {
        this.init(undefined, '');
        this.assertNoSet();
      });

      it('cur: null, next: empty -> set undefined', function () {
        this.init(null, '');
        this.assertSet(undefined);
      });

      it('cur: empty, next: empty -> set undefined', function () {
        this.init('', '');
        this.assertSet(undefined);
      });

      it('cur: string, next: empty -> set undefined', function () {
        this.init('abc', '');
        this.assertSet(undefined);
      });
    });

    describe('setting undef/nil values', () => {
      beforeEach(function () {
        this.init = (from, to) => {
          this.peek.returns(from);
          this.setAt(to);
          this.assertPeek();
          this.assertNoSubmit();
        };
      });

      it('cur: null, next: undef -> set undef', function () {
        this.init(null, undefined);
        this.assertSet(undefined);
      });

      it('cur: string, next: undef -> set undef', function () {
        this.init('abc', undefined);
        this.assertSet(undefined);
      });

      it('cur: empty, next: undef -> set undef', function () {
        this.init('', undefined);
        this.assertSet(undefined);
      });

      it('cur: string, next: null -> set null', function () {
        this.init('abc', null);
        this.assertSet(null);
      });
    });

    describe('patching', () => {
      beforeEach(function () {
        this.init = (from, to) => {
          this.peek.returns(from);
          this.setAt(to);
          this.assertPeek();
          this.assertNoSet();
        };

        this.assertSubmit = (ops) => {
          sinon.assert.calledOnce(this.submitOp.withArgs(ops));
        };
      });

      it('cur: empty, next: string -> insert patch', function () {
        this.init('', 'abc');
        this.assertSubmit([
          {p: this.path.concat([0]), si: 'abc'}
        ]);
      });

      it('cur: string, next: cur+string -> insert patch', function () {
        this.init('abc', 'abcd');
        this.assertSubmit([
          {p: this.path.concat([3]), si: 'd'}
        ]);
      });

      it('cur: string, next: different string -> delete-insert patch', function () {
        this.init('abc', 'abX');
        this.assertSubmit([
          {p: this.path.concat([2]), sd: 'c'},
          {p: this.path.concat([2]), si: 'X'}
        ]);
      });
    });
  });
});
