'use strict';

/**
 * @ngdoc directive
 * @name cfEntrySchema
 * @restrict A
 *
 * @description
 * Exposes the `SchemaController` on the scope and uses the entry’s
 * content type to generate the controllers schema.
 *
 * @scope.provides {SchemaController} schema
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
 * @restrict A
 *
 * @scope.provides {SchemaController} schema
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

      var buildMessage = errorMessageBuilder($scope.spaceContext);
      var schema = createAssetSchema($scope.spaceContext.space.getPrivateLocales());
      $scope.schema = new SchemaController(buildMessage, schema);
    }]
  };
}]);

/**
 * @ngdoc directive
 * @name cfContentTypeSchema
 * @restrict A
 *
 * @scope.provides {SchemaController} schema
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

      var buildMessage = errorMessageBuilder($scope.spaceContext);
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
    this.setSchema(schema);
  }

  SchemaController.prototype.setSchema = function (schema) {
    this.schema = schema;
  };

  SchemaController.prototype.errors = function (data) {
    return this.schema.errors(data);
  };

  SchemaController.prototype.buildMessage = function (error, data) {
    return this.messageBuilder(error, data);
  };

  return SchemaController;
}]);
