angular.module('contentful/directives').directive('newFieldForm', function (availableFieldTypes, toIdentifier, analytics) {
  'use strict';

  return {
    restrict: 'C',
    controller: function ($scope) {
      var defaultType = availableFieldTypes[0];
      $scope.newType = defaultType.value;

      $scope.$watch('newName', function(name, previousName, scope) {
        if (scope.newId &&
            previousName &&
            scope.newId !== toIdentifier(previousName))
          return;
        scope.newId = name ? toIdentifier(name) : '';
      });

      $scope.addField = function() {
        var field = {
          id   : $scope.newId,
          name : $scope.newName,
          required: $scope.newRequired,
          localized: $scope.newLocalized
        };
        _.extend(field, $scope.newType);

        var fieldDoc = $scope.otDoc.at(['fields']);

        fieldDoc.push(field, function(err) {
          if (err) {
            window.alert('ShareJS says no');
          } else {
            $scope.$apply(function(scope) {
              scope.newId = scope.newName = null;
              scope.newType = defaultType.value;
              scope.newRequired = false;
              scope.newLocalized = false;
              scope.otUpdateEntity();
              scope.$broadcast('fieldAdded');
              analytics.track('EntryType', 'Field', 'Add', {
                name: field.name,
                id: field.id,
                type: field.type,
                subtype: field.items ? field.items.type : null,
                localized: field.localized,
                required: field.required
              });
            });
          }
        });
      };

    },

    link: function (scope, elem) {
      scope.$on('fieldAdded', function () {
        elem.find('.field-id').focus();
      });
    }
  };
});
