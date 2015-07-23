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
.directive('cfEntrySchema', [function () {
  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', '$injector', function ($scope, $injector) {
      var errorMessageBuilder = $injector.get('errorMessageBuilder');
      var SchemaController    = $injector.get('SchemaController');
      var createEntrySchema   = $injector.get('validation').fromContentType;

      var buildMessage = errorMessageBuilder($scope.spaceContext);
      $scope.schema = new SchemaController(buildMessage);
      $scope.schema.setContext({ skipDeletedLocaleFieldValidation: true });

      $scope.$watch('spaceContext.publishedTypeForEntry(entry).data', function(data) {
        if (!data) return;
        var locales = $scope.spaceContext.space.data.locales; // TODO: watch this, too
        $scope.schema.setSchema(createEntrySchema(data, locales));
      });
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
.directive('cfAssetSchema', [function () {
  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', '$injector', function ($scope, $injector) {
      var errorMessageBuilder = $injector.get('errorMessageBuilder');
      var SchemaController    = $injector.get('SchemaController');
      var createAssetSchema   = $injector.get('validation').schemas.Asset;

      var buildMessage = errorMessageBuilder.forAsset;
      var schema = createAssetSchema($scope.spaceContext.space.getPrivateLocales());
      $scope.schema.setContext({ skipDeletedLocaleFieldValidation: true });
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
.directive('cfContentTypeSchema', [function () {
  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', '$injector', function ($scope, $injector) {
      var errorMessageBuilder = $injector.get('errorMessageBuilder');
      var SchemaController    = $injector.get('SchemaController');
      var validation          = $injector.get('validation');

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

  function SchemaController(messageBuilder, schema) {
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
    if (this.schema)
      return this.schema.errors(data, this.context);
  };

  SchemaController.prototype.buildMessage = function (error, data) {
    return this.messageBuilder(error, data);
  };

  return SchemaController;
}]);
