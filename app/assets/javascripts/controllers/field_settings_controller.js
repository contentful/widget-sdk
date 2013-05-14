angular.module('contentful/controllers').controller('FieldSettingsCtrl', function ($scope, getFieldTypeName, analytics) {
  'use strict';

  $scope.getFieldTypeName = getFieldTypeName;

  $scope.$watch('publishedIds', function(ids, old, scope) {
    if (ids) {
      scope.published = _.contains(ids, scope.field.id);
    }
  });

  $scope.displayEnabled = function (field) {
    return field.type === 'string' || field.type === 'text';
  };

  $scope.enable = function() {
    $scope.otDoc.at(['fields', this.index, 'disabled']).set(false, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = false;
        analytics.modifiedEntryType('Modified EntryType', scope.entryType, scope.field, 'enable');
      });
    });
  };

  $scope.disable = function() {
    $scope.otDoc.at(['fields', this.index, 'disabled']).set(true, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = true;
        analytics.modifiedEntryType('Modified EntryType', scope.entryType, scope.field, 'disable');
      });
    });
  };

  $scope.delete = function() {
    $scope.otDoc.at(['fields', $scope.index]).remove(function (err) {
      if (!err) $scope.$apply(function(scope) {
        analytics.modifiedEntryType('Modified EntryType', scope.entryType, scope.field, 'delete');
        scope.otUpdateEntity();
      });
    });
  };

});
