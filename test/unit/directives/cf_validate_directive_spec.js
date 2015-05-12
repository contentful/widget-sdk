'use strict';

describe('cfValidate', function () {
  beforeEach(module('contentful/test'));

  describe('validator', function () {

    beforeEach(function () {
      this.scope = this.$inject('$rootScope').$new();

      var $controller = this.$inject('$controller');
      this.validator = $controller('ValidationController', {
        $scope: this.scope,
        $attrs: {cfValidate: 'data'}
      });

      this.errors = sinon.stub();
      this.scope.schema = {errors: this.errors};
    });

    describe('#run()', function () {

      describe('without schema errors', function () {
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

      describe('with schema errors', function () {
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

    describe('#run(path)', function () {
      beforeEach(function () {
        this.validator.setErrors([
          {name: '1', path: ['a']},
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']},
        ]);
      });

      it('removes errors if path is valid', function () {
        this.errors.returns([
          {name: '1x', path: ['a']},
        ]);
        this.validator.run('a.b');
        expect(this.validator.errors).toEqual([
          {name: '1', path: ['a']},
          {name: '3', path: ['a', 'b', 'c']},
        ]);

        this.validator.run('a.b', true);
        expect(this.validator.errors).toEqual([
          {name: '1', path: ['a']},
        ]);
      });

      it('replaces errors if path is invalid', function () {
        this.errors.returns([
          {name: '1x', path: ['a']},
          {name: '2x', path: ['a', 'b']},
          {name: '2y', path: ['a', 'b']},
          {name: '3x', path: ['a', 'b', 'c']},
        ]);
        this.validator.run('a.b');
        expect(_.sortBy(this.validator.errors, 'name')).toEqual([
          {name: '1', path: ['a']},
          {name: '2x', path: ['a', 'b']},
          {name: '2y', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']},
        ]);

        this.validator.run('a.b.*');
        expect(_.sortBy(this.validator.errors, 'name')).toEqual([
          {name: '1', path: ['a']},
          {name: '2x', path: ['a', 'b']},
          {name: '2y', path: ['a', 'b']},
          {name: '3x', path: ['a', 'b', 'c']},
        ]);
      });
    });

    describe('#getPathErrors(path)', function () {

      it('returns errors with exact path', function () {
        this.validator.errors = [
          {name: '1', path: ['a']},
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']},
        ];

        var errors = this.validator.getPathErrors('a.b');
        expect(errors).toEqual([{name: '2', path: ['a', 'b']}]);
      });

      it('collects errors with glob and parent', function () {
        this.validator.errors = [
          {name: '1', path: ['a']},
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']},
        ];

        var expectedErrors = [
          {name: '2', path: ['a', 'b']},
          {name: '3', path: ['a', 'b', 'c']},
        ];
        var errorsGlob = this.validator.getPathErrors('a.b.*');
        expect(errorsGlob).toEqual(expectedErrors);
        var errorsParent = this.validator.getPathErrors('a.b', true);
        expect(errorsParent).toEqual(expectedErrors);
      });
    });

    it('runs validation on "validate" event', function () {
      sinon.spy(this.validator, 'run');
      this.scope.$broadcast('validate');
      this.$apply();
      sinon.assert.calledOnce(this.validator.run);
    });
  });

  describe('with cfEntrySchema', function () {

    beforeEach(function () {
      var $compile = this.$inject('$compile');
      var $rootScope = this.$inject('$rootScope');

      var template = '<div cf-validate="entry" cf-entry-schema></div>';
      var element = $compile(template)($rootScope);
      this.scope = element.scope();
      this.$apply();

    });

    it('validation is undefined if schema not set yet', function () {
      this.scope.entry = {};
      this.scope.validate();
      expect(this.scope.validationResult.valid).toBeUndefined();
    });
  });

  describe('with cfContentTypeSchema', function () {

    var fieldFixture = {
      id: 'fieldId',
      apiName: 'fieldApiName',
      name: 'fieldName',
      type: 'Symbol'
    };

    beforeEach(function () {
      var $compile = this.$inject('$compile');
      var $rootScope = this.$inject('$rootScope');

      var template = '<div cf-validate="contentType" cf-content-type-schema></div>';
      var element = $compile(template)($rootScope);
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

    it('generates missing fields error', function () {
      this.scope.contentType = {
        name: 'MyContentType',
        fields: []
      };
      this.scope.validate();
      expect(this.scope.validationResult.errors.length).toBe(1);
      var error = this.scope.validationResult.errors[0];
      expect(error.name).toBe('size');
      expect(error.message).toBe('Please provide between 1 and 50 fields');
    });

    it('generates missing name error', function () {
      this.scope.contentType = {
        fields: [fieldFixture]
      };
      this.scope.validate();
      expect(this.scope.validationResult.errors.length).toBe(1);
      var error = this.scope.validationResult.errors[0];
      expect(error.name).toBe('required');
      expect(error.message).toBe('Required');
    });
  });

  describe('with cfAssetSchema', function () {
    beforeEach(function () {
      var $compile = this.$inject('$compile');
      var $rootScope = this.$inject('$rootScope');

      var defaultLocale = {
        code: 'default-locale',
        default: true
      };

      $rootScope.spaceContext = {
        space: {
          getPrivateLocales: sinon.stub().returns([defaultLocale])
        }
      };

      var template = '<div cf-validate="asset" cf-asset-schema></div>';
      var element = $compile(template)($rootScope);
      this.scope = element.scope();
      this.$apply();
    });

    it('generates invalid url errror', function () {
      this.scope.asset = {
        fields: {
          file: {
            'default-locale': {
              fileName: '',
              contentType: 'ct'
            }
          }
        }
      };
      this.scope.validate();
      expect(this.scope.validationResult.errors.length).toBe(1);
      var error = this.scope.validationResult.errors[0];
      expect(error.name).toBe('required');
      expect(error.message).toBe('Cannot publish until processing has finished');
    });
  });
});
