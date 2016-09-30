'use strict';

/**
 * @ngdoc directive
 * @name cfEntrySchema
 * @usage[jade]
 * div(cf-validate="entry" cf-entry-schema)
 *
 * @description
 * Exposes the `SchemaController` on the scope and uses the entry’s
 * content type to generate the controllers schema.
 *
 * @property {SchemaController} $scope.schema
 *
 * @scope.requires {SpaceContext} spaceContext
 * @scope.requires {Entry}         entry
 */
angular.module('contentful')
.directive('cfEntrySchema', ['require', function (require) {
  var errorMessageBuilder = require('errorMessageBuilder');
  var SchemaController = require('SchemaController');
  var createEntrySchema = require('validation').fromContentType;
  var spaceContext = require('spaceContext');

  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', function ($scope) {
      var buildMessage = errorMessageBuilder($scope.spaceContext);
      $scope.schema = new SchemaController(buildMessage);
      $scope.schema.setContext({ skipDeletedLocaleFieldValidation: true });

      var ctData = $scope.contentType.data;
      var locales = spaceContext.space.data.locales;
      $scope.schema.setSchema(createEntrySchema(ctData, locales));
    }]
  };
}]);

/**
 * @ngdoc directive
 * @name cfAssetSchema
 * @usage[jade]
 * div(cf-validate="asset" cf-asset-schema)
 *
 * @property {SchemaController} $scope.schema
 *
 * @scope.requires {SpaceContext} spaceContext
 */
angular.module('contentful')
.directive('cfAssetSchema', ['require', function (require) {
  var errorMessageBuilder = require('errorMessageBuilder');
  var SchemaController = require('SchemaController');
  var createAssetSchema = require('validation').schemas.Asset;

  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', function ($scope) {
      var buildMessage = errorMessageBuilder.forAsset;
      var schema = createAssetSchema($scope.spaceContext.space.getPrivateLocales());
      $scope.schema = new SchemaController(buildMessage, schema);
      $scope.schema.setContext({ skipDeletedLocaleFieldValidation: true });
    }]
  };
}]);

/**
 * @ngdoc directive
 * @name cfContentTypeSchema
 * @usage[jade]
 * div(cf-validate="contentType" cf-content-type-schema)
 *
 * @property {SchemaController} $scope.schema
 */
angular.module('contentful')
.directive('cfContentTypeSchema', ['require', function (require) {
  var errorMessageBuilder = require('errorMessageBuilder');
  var SchemaController = require('SchemaController');
  var validation = require('validation');

  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', function ($scope) {
      var buildMessage = errorMessageBuilder.forContentType;
      $scope.schema = new SchemaController(buildMessage, validation.schemas.ContentType);
    }]
  };
}]);

/**
 * @ngdoc type
 * @name SchemaController
 *
 * @description
 * The Schema Controller validates data against a schema creates
 * error messages.
 */
angular.module('contentful')
.factory('SchemaController', [function () {

  function SchemaController (messageBuilder, schema) {
    this.messageBuilder = messageBuilder;
    this.context = {};
    this.setSchema(schema);
  }

  /**
   * @ngdoc method
   * @name SchemaController#setSchema
   * @param {Schema} schema
   */
  SchemaController.prototype.setSchema = function (schema) {
    this.schema = schema;
  };

  /**
   * @ngdoc method
   * @name SchemaController#setContext
   * @param {Schema} schema
   */
  SchemaController.prototype.setContext = function (context) {
    this.context = context;
  };

  /**
   * @ngdoc method
   * @name SchemaController#errors
   * @param data
   * @returns {Array<Error>}
   */
  SchemaController.prototype.errors = function (data) {
    if (this.schema) {
      return this.schema.errors(data, this.context);
    }
  };

  SchemaController.prototype.buildMessage = function (error, data) {
    return this.messageBuilder(error, data);
  };

  return SchemaController;
}]);
