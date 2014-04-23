'use strict';

angular.module('contentful').controller('ViewCustomizerCtrl', function ViewCustomizerCtrl($scope) {

  var displayedFieldIds, fields;

  function determineFieldVisibility() {
    var displayedFields = $scope.systemFields.concat(fields);

    var displayFilter = function(field) {
      return _.contains(displayedFieldIds, field.id);
    };

    $scope.displayedFields = _.filter(displayedFields, displayFilter);
    $scope.hiddenFields = _.sortBy(_.reject(displayedFields, displayFilter), 'name');
  }

  $scope.$watch('filteredContentType', function () {
    displayedFieldIds = ['author', 'updatedAt'];
  });

  $scope.$watch('filteredContentTypeFields', function (contentTypeFields) {
    fields = contentTypeFields;
    determineFieldVisibility();
  });

  $scope.addDisplayField = function (fieldId) {
    displayedFieldIds.push(fieldId);
    determineFieldVisibility();
  };

  $scope.removeDisplayField = function (fieldId) {
    var index = _.indexOf(displayedFieldIds, fieldId);
    displayedFieldIds.splice(index, 1);
    determineFieldVisibility();
  };

});
