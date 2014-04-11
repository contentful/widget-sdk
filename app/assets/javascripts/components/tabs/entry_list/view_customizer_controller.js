'use strict';

angular.module('contentful').controller('ViewCustomizerCtrl', function ViewCustomizerCtrl($scope) {

  var systemFields = [
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
    },
    {
      id: 'updated',
      name: 'Updated',
      type: 'Date',
      sys: true,
      persistent: true
    }
  ];

  function initFields() {
    $scope.displayedFields = systemFields;
    $scope.hiddenFields = [];
  }

  var displayedFieldIds = ['author', 'status', 'updated'];

  initFields();

  $scope.$watch('filteredContentType', function (contentType) {
    if(!contentType){
      initFields();
    } else {
      var fields = contentType ? contentType.data.fields : [];
      var displayedFields = systemFields.concat(fields);

      var titleIndex = _.findIndex(displayedFields, function (field) {
        return field.id == contentType.data.displayField;
      });
      displayedFields[titleIndex].persistent = true;
      displayedFieldIds.push(displayedFields[titleIndex].id);

      displayedFields = _.sortBy(displayedFields, 'name');

      var displayFilter = function(field) {
        return _.contains(displayedFieldIds, field.id);
      };

      $scope.displayedFields = _.filter(displayedFields, displayFilter);
      $scope.hiddenFields = _.reject(displayedFields, displayFilter);
    }
  });

});
