angular.module('contentful').directive('newFieldForm', function (availableFieldTypes, toIdentifier, analytics, notification) {
  'use strict';

  return {
    restrict: 'C',
    controller: function ($scope) {
      var defaultType = availableFieldTypes[0];
      $scope.newType = defaultType;
      resetNewField();

      $scope.$watch('newField.name', function(name, previousName, scope) {
        if (scope.newField.id &&
            previousName &&
            scope.newField.id !== toIdentifier(previousName))
          return;
        scope.newField.id = name ? toIdentifier(name) : '';
      });

      $scope.$watch('newType', function (newType, old, scope) {
        _.extend(scope.newField, newType.value);
      });

      $scope.addField = function() {
        var fieldDoc = $scope.otDoc.at(['fields']);

        fieldDoc.push($scope.newField, function(err) {
          if (err) {
            notification.error('Could not add field');
          } else {
            $scope.$apply(function(scope) {
              var field = $scope.newField;
              resetNewField();
              scope.otUpdateEntity();
              scope.$broadcast('fieldAdded');
              analytics.modifiedContentType('Modified ContentType', scope.contentType, field, 'add');
            });
          }
        });
      };

      $scope.selectType = function(type) {
        $scope.newType = type;
      };

      function resetNewField() {
        $scope.newField = {
          id: null,
          name: null,
          type: defaultType.value.type,
          required: false,
          localized: false
        };

        $scope.newType = defaultType;
      }

      $scope.$watch(function (scope) {
        scope.idExists = _.find(scope.contentType.data.fields, function (field) {
          return field.id == scope.newField.id;
        });
      });

      $scope.$watch(function (scope) {
        return scope.validationResult.valid && !scope.idExists;
      }, function (valid, old, scope) {
        scope.formValid = valid;
      });
    },

    link: function (scope, elem) {
      scope.$on('fieldAdded', function () {
        elem.find('input').eq(0).focus();
      });
    }
  };
});
