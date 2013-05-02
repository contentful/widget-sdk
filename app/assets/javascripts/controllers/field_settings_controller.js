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
        analytics.track('EntryType', 'Field', 'Enable', {
          name: scope.field.name,
          id: scope.field.id,
          type: scope.field.type,
          subtype: scope.field.items ? scope.field.items.type : null,
          localized: scope.field.localized,
          required: scope.field.required
        });
      });
    });
  };

  $scope.disable = function() {
    $scope.otDoc.at(['fields', this.index, 'disabled']).set(true, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = true;
        analytics.track('EntryType', 'Field', 'Disable', {
          name: scope.field.name,
          id: scope.field.id,
          type: scope.field.type,
          subtype: scope.field.items ? scope.field.items.type : null,
          localized: scope.field.localized,
          required: scope.field.required
        });
      });
    });
  };

  $scope.delete = function() {
    $scope.otDoc.at(['fields', $scope.index]).remove(function (err) {
      if (!err) $scope.$apply(function(scope) {
        analytics.track('EntryType', 'Field', 'Delete', {
          name: scope.field.name,
          id: scope.field.id,
          type: scope.field.type,
          subtype: scope.field.items ? scope.field.items.type : null,
          localized: scope.field.localized,
          required: scope.field.required
        });
        scope.otUpdateEntity();
      });
    });
  };

});
