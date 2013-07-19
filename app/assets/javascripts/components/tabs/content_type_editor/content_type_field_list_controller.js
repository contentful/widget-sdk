'use strict';

angular.module('contentful').controller('ContentTypeFieldListCtrl', function($scope, analytics) {
  var _showValidations = {};
  $scope.showValidations = function(fieldId) {
    return !!_showValidations[fieldId];
  };

  $scope.toggleValidations= function(fieldId) {
    _showValidations[fieldId] = !_showValidations[fieldId];
    if (_showValidations[fieldId]) {
      analytics.track('Opened Validations', { fieldId: fieldId });
    }
  };

  $scope.closeAllValidations = function () {
    _showValidations = {};
  };

  $scope.displayEnabled = function (field) {
    return field.type === 'Symbol' || field.type === 'Text';
  };

  $scope.removeDisplayField = function () {
    $scope.otDoc.at(['displayField']).set(null, function (err) {
      if (!err) $scope.$apply(function (scope) {
        scope.contentType.data.displayField = null;
      });
    });
  };

  $scope.$watch('validationResult.errors', function (errors, old, scope) {
    _.each(errors, function (error) {
      if (error.path[2] === 'validations' || error.path[3] === 'validations') {
        var fieldId = scope.contentType.data.fields[error.path[1]].id;
        _showValidations[fieldId] = true;
      }
    });
  });

});

