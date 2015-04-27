'use strict';

describe('cfValidate', function () {
  beforeEach(module('contentful/test'));

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

describe('ErrorPathController', function () {
  var controller, scope, attrs;

  beforeEach(module('contentful/test'));

  beforeEach(function () {
    var $rootScope = this.$inject('$rootScope');
    var $controller = this.$inject('$controller');
    var errorMessageBuilder = this.$inject('errorMessageBuilder');

    scope = $rootScope.$new();

    scope.entity = {};
    scope.schema = {
      errors: sinon.stub(),
      buildMessage: errorMessageBuilder(),
    };

    $controller('ValidationController', {
      $scope: scope,
      $attrs: {
        cfValidate: 'entity',
      }
    });

    attrs = {};
    controller = $controller('ErrorPathController', {
      $scope: scope,
      $attrs: attrs
    });

    this.processError = function (error) {
      if (error)
        scope.schema.errors.returns([error]);
      scope.validate();
      scope.$apply();
    };

  });

  describe('"size" error message', function () {
    beforeEach(function () {
      attrs.cfErrorPath = '["foo", "bar"]';
    });

    it('shows error for string data', function () {
      this.processError({
        name: 'size',
        path: ['foo', 'bar'],
        min: 10,
        value: 'foobar'
      });
      expect(controller.messages)
      .toEqual(['Please expand the text so it\'s no shorter than 10 characters']);
    });

    it('shows error for array data', function () {
      this.processError({
        name: 'size',
        path: ['foo', 'bar'],
        min: 10,
        value: []
      });
      expect(controller.messages)
      .toEqual(['Please provide at least 10 items']);
    });
  });

  describe('Errors in items', function () {
    beforeEach(function () {
      attrs.cfErrorPath = '["foo", "bars", "*"]';
    });

    it('builds size error message', function () {
      this.processError({
        name: 'size',
        path: ['foo', 'bars'],
        min: 10,
        value: []
      });
      expect(controller.messages)
      .toEqual(['Please provide at least 10 items']);
    });

    it('shows custom error message', function () {
      this.processError({
        name: 'size',
        path: ['foo', 'bars'],
        customMessage: 'CUSTOM MESSAGE',
        min: 10
      });
      expect(controller.messages).toEqual(['CUSTOM MESSAGE']);
    });

    it('falls back to "details" property', function () {
      this.processError({
        name: 'this is an unknown validation',
        path: ['foo', 'bars'],
        details: 'DETAILS'
      });
      expect(controller.messages).toEqual(['DETAILS']);
    });

    it('falls back to error name property', function () {
      this.processError({
        name: 'this is an unknown validation',
        path: ['foo', 'bars'],
      });
      expect(controller.messages)
      .toEqual(['Error: this is an unknown validation']);
    });

    it('shows errors in sub-path', function () {
      this.processError({
        name: 'size',
        path: ['foo', 'bars', 1],
        min: 10,
        value: 'foobars'
      });
      expect(controller.messages)
      .toEqual(['Please expand the text so it\'s no shorter than 10 characters']);
    });
  });
});
