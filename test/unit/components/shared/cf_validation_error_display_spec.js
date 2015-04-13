'use strict';

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
      scope.entity = {
        foo: {
          bar: null
        }
      };

      scope.schema.errors.returns([{
        name: 'size',
        path: ['foo', 'bar'],
        min: 10
      }]);
    });

    it('shows error for string data', function () {
      scope.entity.foo.bar = 'asdasd';
      this.processError();
      expect(controller.messages)
      .toEqual(['Please expand the text so it\'s no shorter than 10 characters']);
    });

    it('shows error for array data', function () {
      scope.entity.foo.bar = [1,2,3];
      this.processError();
      expect(controller.messages)
      .toEqual(['Please provide at least 10 items']);
    });
  });

  describe('Errors in items', function () {
    beforeEach(function () {
      attrs.cfErrorPath = '["foo", "bars", "*"]';
      scope.entity = {
        foo: {
          bars: ['asdasd', 'asdasd','asdasd']
        }
      };
    });

    it('builds size error message', function () {
      this.processError({
        name: 'size',
        path: ['foo', 'bars'],
        min: 10
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
        min: 10
      });
      expect(controller.messages)
      .toEqual(['Please expand the text so it\'s no shorter than 10 characters']);
    });
  });
});
