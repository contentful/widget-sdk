'use strict';
angular.module('contentful').controller('FieldSettingsController', ['$scope', function ($scope) {

  $scope.displayEnabled = function (field) {
    return field.type === 'Symbol' || field.type === 'Text';
  };

  $scope.displayedFieldName = function (field) {
    return _.isEmpty(field.name) ?
             _.isEmpty(field.id) ?  'Untitled field' : 'ID: '+field.id
           : field.name;
  };

}]);
