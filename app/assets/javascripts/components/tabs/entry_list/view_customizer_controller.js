'use strict';

angular.module('contentful').controller('ViewCustomizerCtrl', function ViewCustomizerCtrl($scope) {

  var systemFields = [
    {
      id: 'updated',
      name: 'Updated',
      type: 'Date',
      sys: true,
      persistent: true
    },
    {
      id: 'author',
      name: 'Author',
      type: 'Symbol',
      sys: true
    },
    {
      id: 'status',
      name: 'Status',
      type: 'Symbol',
      sys: true,
      persistent: true
    }
  ];

  var displayedFieldIds = ['author', 'status', 'updated'];

  function initFields() {
    $scope.displayedFields = systemFields;
    $scope.hiddenFields = [];
  }

  function determineFieldVisibility() {
    var displayedFields = systemFields.concat($scope.filteredContentTypeFields);

    var titleIndex = _.findIndex(displayedFields, function (field) {
      return field.id == $scope.filteredContentType.data.displayField;
    });
    displayedFields[titleIndex].persistent = true;
    displayedFieldIds.push(displayedFields[titleIndex].id);

    var displayFilter = function(field) {
      return _.contains(displayedFieldIds, field.id);
    };

    $scope.displayedFields = _.filter(displayedFields, displayFilter);
    $scope.hiddenFields = _.sortBy(_.reject(displayedFields, displayFilter), 'name');
  }

  initFields();

  $scope.$watch('filteredContentType', function (contentType) {
    if(!contentType){
      initFields();
    } else {
      $scope.filteredContentTypeFields = contentType ? contentType.data.fields : [];
      determineFieldVisibility();
    }
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
