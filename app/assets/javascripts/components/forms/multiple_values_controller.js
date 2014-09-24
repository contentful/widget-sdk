'use strict';
angular.module('contentful').controller('MultipleValuesController', ['$scope', function MultipleValuesController($scope){
  this.valuesList = getValues($scope.field);
  this.selected   = {value: null};

  function getValues(field) {
    if (field.type === 'Boolean') {
      return [
        {value: true,  label: 'Yes'},
        {value: false, label: 'No' },
      ];
    } else {
      // TODO getFieldValidationsOfType should come from a service or be defined here
      // Having it on the scope is ugly
      return _.map($scope.getFieldValidationsOfType(field, 'in'), function (value) {
        return { value: value, label: value.toString() };
      });
    }
  }

}]);
