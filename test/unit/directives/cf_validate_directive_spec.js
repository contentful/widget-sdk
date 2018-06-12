'use strict';

describe('cfValidate', () => {
  beforeEach(module('contentful/test'));

  describe('validator', () => {
    beforeEach(function () {
      this.scope = this.$inject('$rootScope').$new();

      const $controller = this.$inject('$controller');
      this.validator = $controller('ValidationController', {
        $scope: this.scope,
        $attrs: {cfValidate: 'data'}
      });

      this.errors = sinon.stub();
      this.scope.schema = {errors: this.errors};
    });

    describe('#run()', () => {
      describe('without schema errors', () => {
        beforeEach(function () {
          this.errors.returns([]);
        });

        it('return true', function () {
          expect(this.validator.run()).toBe(true);
        });

        it('sets validation result to "valid"', function () {
          expect(this.scope.validationResult.valid).toBeUndefined();
          expect(this.validator.valid).toBeUndefined();
          this.validator.run();
          expect(this.scope.validationResult.valid).toBe(true);
          expect(this.validator.valid).toBe(true);
        });
      });

      describe('with schema errors', () => {
        beforeEach(function () {
          this.errors.returns([{name: 'oops'}]);
        });

        it('return false', function () {
          expect(this.validator.run()).toBe(false);
        });

        it('sets validation result to "invalid"', function () {
          expect(this.scope.validationResult.valid).toBeUndefined();
          expect(this.validator.valid).toBeUndefined();
          this.validator.run();
          expect(this.scope.validationResult.valid).toBe(false);
          expect(this.validator.valid).toBe(false);
        });

        it('adds validation errors to scope', function () {
          expect(this.scope.validationResult.errors).toBeUndefined();
          expect(this.validator.errors).toEqual([]);
          this.validator.run();
          expect(this.scope.validationResult.errors).toEqual([{name: 'oops'}]);
          expect(this.validator.errors).toEqual([{name: 'oops'}]);
        });
      });
    });

    describe('#run(path)', () => {
      beforeEach(function () {
        this.validator.setErrors([
          {name: '1', path: ['a']},
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']}
        ]);
      });

      it('removes errors if path is valid', function () {
        this.errors.returns([
          {name: '1x', path: ['a']}
        ]);
        this.validator.run('a.b');
        expect(this.validator.errors).toEqual([
          {name: '1', path: ['a']},
          {name: '3', path: ['a', 'b', 'c']}
        ]);

        this.validator.run('a.b', true);
        expect(this.validator.errors).toEqual([
          {name: '1', path: ['a']}
        ]);
      });

      it('replaces errors if path is invalid', function () {
        this.errors.returns([
          {name: '1x', path: ['a']},
          {name: '2x', path: ['a', 'b']},
          {name: '2y', path: ['a', 'b']},
          {name: '3x', path: ['a', 'b', 'c']}
        ]);
        this.validator.run('a.b');
        expect(_.sortBy(this.validator.errors, 'name')).toEqual([
          {name: '1', path: ['a']},
          {name: '2x', path: ['a', 'b']},
          {name: '2y', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']}
        ]);

        this.validator.run('a.b.*');
        expect(_.sortBy(this.validator.errors, 'name')).toEqual([
          {name: '1', path: ['a']},
          {name: '2x', path: ['a', 'b']},
          {name: '2y', path: ['a', 'b']},
          {name: '3x', path: ['a', 'b', 'c']}
        ]);
      });
    });

    describe('#getPathErrors(path)', () => {
      it('returns errors with exact path', function () {
        this.validator.errors = [
          {name: '1', path: ['a']},
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']}
        ];

        const errors = this.validator.getPathErrors('a.b');
        expect(errors).toEqual([{name: '2', path: ['a', 'b']}]);
      });

      it('collects errors with glob and parent', function () {
        this.validator.errors = [
          {name: '1', path: ['a']},
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']}
        ];

        const expectedErrors = [
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']}
        ];
        const errorsGlob = this.validator.getPathErrors('a.b.*');
        expect(errorsGlob).toEqual(expectedErrors);
        const errorsParent = this.validator.getPathErrors('a.b', true);
        expect(errorsParent).toEqual(expectedErrors);
      });
    });

    it('runs validation on "validate" event', function () {
      sinon.spy(this.validator, 'run');
      this.scope.$broadcast('validate');
      this.$apply();
      sinon.assert.calledOnce(this.validator.run);
    });
    describe('#hasError()', () => {
      beforeEach(function () {
        this.setErrors = function (paths) {
          this.validator.setErrors(paths.map(path => ({
            path: path
          })));
        };
      });

      it('returns true when exact path has error', function () {
        this.setErrors([['a', 'b'], ['other']]);
        expect(this.validator.hasError(['a', 'b'])).toBe(true);
      });

      it('returns true when exact child path has error', function () {
        this.setErrors([['a', 'b', 'c'], ['other']]);
        expect(this.validator.hasError(['a', 'b'])).toBe(true);
      });

      it('returns false when parent path has error', function () {
        this.setErrors([['a']]);
        expect(this.validator.hasError(['a', 'b'])).toBe(false);
      });
    });
  });

  describe('with cfContentTypeSchema', () => {
    const fieldFixture = {
      id: 'fieldId',
      apiName: 'fieldApiName',
      name: 'fieldName',
      type: 'Symbol'
    };

    beforeEach(function () {
      const $compile = this.$inject('$compile');
      const $rootScope = this.$inject('$rootScope');

      const template = '<div cf-validate="contentType" cf-content-type-schema></div>';
      const element = $compile(template)($rootScope);
      this.scope = element.scope();
      this.$apply();
    });

    it('validates', function () {
      this.scope.contentType = {
        name: 'MyContentType',
        fields: [fieldFixture]
      };
      this.scope.validate();
      expect(this.scope.validationResult.valid).toBe(true);
    });

    it('generates missing name error', function () {
      this.scope.contentType = {
        fields: [fieldFixture]
      };
      this.scope.validate();
      expect(this.scope.validationResult.errors.length).toBe(1);
      const error = this.scope.validationResult.errors[0];
      expect(error.name).toBe('required');
      expect(error.message).toBe('Required');
    });
  });
});
