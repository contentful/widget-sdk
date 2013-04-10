angular.module('contentful/controllers').controller('EntryTypeFieldSettingsCtrl', function ($scope, getFieldTypeName) {
  'use strict';

  $scope.getFieldTypeName = getFieldTypeName;

  $scope.$watch('publishedIds', function(ids, old, scope) {
    if (ids) {
      scope.published = _.contains(ids, scope.field.id);
    }
  });

  $scope.enable = function() {
    this.doc.at(['fields', this.index, 'disabled']).set(false, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = false;
      });
    });
  };

  $scope.disable = function() {
    this.doc.at(['fields', this.index, 'disabled']).set(true, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = true;
      });
    });
  };

  $scope.delete = function() {
    this.doc.at(['fields', this.index]).remove();
  };

});
