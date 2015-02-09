'use strict';
angular.module('contentful').controller('FieldSettingsEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var $controller      = $injector.get('$controller');
  var analytics        = $injector.get('analytics');
  var assert           = $injector.get('assert');
  var defer            = $injector.get('defer');
  var getFieldTypeName = $injector.get('getFieldTypeName');
  var logger           = $injector.get('logger');
  var modalDialog      = $injector.get('modalDialog');
  var notification     = $injector.get('notification');
  var validation       = $injector.get('validation');

  $scope.apiNameController = $controller('ApiNameController', {$scope: $scope});

  $scope.$watch(hasValidationsWatcher,     hasValidationsChanged);
  $scope.$watch('fieldTypeParams(field)',  paramsChanged, true);
  $scope.$watch('fieldIsPublished(field)', publishedChanged);

  $scope.getFieldTypeName  = getFieldTypeName;
  $scope.delete            = _delete; angular.noop(_delete); //TODO the noop prevents a bug in JSHint
  $scope.toggle            = toggle;
  $scope.changeFieldType   = changeFieldType;
  $scope.isDisplayField    = isDisplayField;
  $scope.statusTooltipText = statusTooltipText;
  $scope.statusClass       = statusClass;
  $scope.openValidationDialog = openValidationDialog;

  function hasValidationsWatcher(scope){
    var f = scope.field;
    return _.isEmpty(f.validations) && _.isEmpty(f.items && f.items.validations);
  }

  function hasValidationsChanged(noValidations, old, scope) {
    scope.hasValidations = !noValidations;
  }

  function paramsChanged(typeParams, old, scope) {
    scope.validationsAvailable = !_.isEmpty(validation.Validation.perType($scope.field));
  }

  function publishedChanged(published, old, scope) {
    scope.published = published;
  }

  function statusTooltipText() {
    if ($scope.published)
      if ($scope.field.disabled)
        return 'Disabled - this Field is not shown to editors by default.';
      else
        return 'Active - this Field is visible to editors.';
    else
      return 'New - this Field is new and the Content Type needs to be activated again to make it available for editors.';
  }

  function statusClass() {
    if ($scope.published)
      if ($scope.field.disabled)
        return 'disabled';
      else
        return 'published';
    else
      return 'unpublished';
  }

  function isDisplayField() {
    return $scope.contentType.data.displayField === $scope.field.id;
  }

  function changeFieldType(newType) {
    if (!$scope.otDoc) return false;

    var newField = _.extend({
      name: $scope.field.name,
      id: $scope.field.id,
      apiName: $scope.field.apiName
    }, newType);

    var subdoc = $scope.otDoc.at(['fields', $scope.index]);
    subdoc.set(newField, function(err) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.otUpdateEntity();
          defer($scope.pickNewDisplayField);
        } else {
          logger.logSharejsWarn('Could not change type.', {error: err });
          notification.error('Could not change type.');
        }
      });
    });
  }

  function toggle(property) {
    assert.truthy(property, 'need a property to toggle');
    if (!$scope.otDoc) return false;
    var subdoc = $scope.otDoc.at(['fields', $scope.index, property]);
    subdoc.set(!subdoc.get(), function(err) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.otUpdateEntity();
          analytics.modifiedContentType('Modified ContentType', scope.contentType, scope.field, 'toggled '+property);
        } else {
          notification.warn('Could not toggle "'+property+'"', err);
          logger.logSharejsWarn('Could not toggle property on ContentType', {
            error: err,
            data: {property: property}});
        }
      });
    });
  }

  function _delete() {
    if (!$scope.otDoc) return false;
    var field = $scope.field;
    $scope.otDoc.at(['fields', $scope.index]).remove(function (err) {
      if (!err) $scope.$apply(function(scope) {
        analytics.modifiedContentType('Modified ContentType', scope.contentType, field, 'delete');
        scope.otUpdateEntity();
        scope.$emit('fieldDeleted', field);
        defer($scope.pickNewDisplayField);
      });
    });
  }

  function openValidationDialog() {
    modalDialog.open({
      scope: $scope,
      title: 'Validations',
      template: 'validation_dialog',
      ignoreEnter: true
    });
  }
}]);
