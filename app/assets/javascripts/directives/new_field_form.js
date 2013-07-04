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
        if (old) _.each(old.value, function(val, key){
          delete scope.newField[key];
        });
        _.extend(scope.newField, newType.value);
      });

      $scope.selectType = function(type) {
        $scope.newType = type;
      };

      function initDisplayName(field) {
        if (!$scope.contentType.data.displayField && $scope.displayEnabled(field)) {
          $scope.otDoc.setAt(['displayField'], field.id, function (err) {
            if (!err) $scope.$apply(function (scope) {
              scope.contentType.data.displayField = field.id;
            });
          });
        }
      }

      function resetNewField() {
        $scope.newField = {
          id: null,
          name: null,
          required: false,
          localized: false
        };
        $scope.newType = defaultType;
        _.extend($scope.newField, $scope.newType.value);
      }

      $scope.addField = function() {
        var fieldDoc = $scope.otDoc.at(['fields']);

        fieldDoc.push($scope.newField, function(err) {
          $scope.$apply(function(scope) {
            if (err) {
              notification.error('Could not add field');
            } else {
                var field = $scope.newField;
                initDisplayName(field);
                resetNewField();
                scope.otUpdateEntity();
                scope.$broadcast('fieldAdded');
                analytics.modifiedContentType('Modified ContentType', scope.contentType, field, 'add');
            }
          });
        });
      };

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
