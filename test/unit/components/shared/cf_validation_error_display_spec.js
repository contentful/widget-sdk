'use strict';

describe('ErrorPathController', () => {
  let controller, scope, attrs;

  afterEach(() => {
    controller = scope = attrs = null;
  });

  beforeEach(module('contentful/test'));

  beforeEach(function() {
    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    const errorMessageBuilder = this.$inject('errorMessageBuilder');

    scope = $rootScope.$new();

    scope.entity = {};
    scope.schema = {
      errors: sinon.stub(),
      buildMessage: errorMessageBuilder()
    };

    $controller('ValidationController', {
      $scope: scope,
      $attrs: {
        cfValidate: 'entity'
      }
    });

    attrs = {};
    controller = $controller('ErrorPathController', {
      $scope: scope,
      $attrs: attrs
    });

    this.processError = error => {
      if (error) {
        scope.schema.errors.returns([error]);
      }
      scope.validate();
      scope.$apply();
    };
  });

  describe('"size" error message', () => {
    beforeEach(() => {
      attrs.cfErrorPath = '["foo", "bar"]';
    });

    it('shows error for string data', function() {
      this.processError({
        name: 'size',
        path: ['foo', 'bar'],
        min: 10,
        value: 'foobar'
      });
      expect(controller.messages).toEqual([
        "Please expand the text so it's no shorter than 10 characters"
      ]);
    });

    it('shows error for array data', function() {
      this.processError({
        name: 'size',
        path: ['foo', 'bar'],
        min: 10,
        value: []
      });
      expect(controller.messages).toEqual(['Please provide at least 10 items']);
    });
  });

  describe('Errors in items', () => {
    beforeEach(() => {
      attrs.cfErrorPath = '["foo", "bars", "*"]';
    });

    it('builds size error message', function() {
      this.processError({
        name: 'size',
        path: ['foo', 'bars'],
        min: 10,
        value: []
      });
      expect(controller.messages).toEqual(['Please provide at least 10 items']);
    });

    it('shows custom error message', function() {
      this.processError({
        name: 'size',
        path: ['foo', 'bars'],
        customMessage: 'CUSTOM MESSAGE',
        min: 10
      });
      expect(controller.messages).toEqual(['CUSTOM MESSAGE']);
    });

    it('falls back to "details" property', function() {
      this.processError({
        name: 'this is an unknown validation',
        path: ['foo', 'bars'],
        details: 'DETAILS'
      });
      expect(controller.messages).toEqual(['DETAILS']);
    });

    it('falls back to error name property', function() {
      this.processError({
        name: 'this is an unknown validation',
        path: ['foo', 'bars']
      });
      expect(controller.messages).toEqual(['Error: this is an unknown validation']);
    });

    it('shows errors in sub-path', function() {
      this.processError({
        name: 'size',
        path: ['foo', 'bars', 1],
        min: 10,
        value: 'foobars'
      });
      expect(controller.messages).toEqual([
        "Please expand the text so it's no shorter than 10 characters"
      ]);
    });
  });
});
