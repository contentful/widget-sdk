'use strict';
angular.module('contentful')
.controller('ContentTypeFieldController', ['$scope', '$injector',
function ($scope, $injector) {
  var pluralize   = $injector.get('pluralize');
  var modalDialog = $injector.get('modalDialog');

  $scope.openSettingsDialog = function openSettingsDialog() {
    var dialog = modalDialog.open({
      scope: $scope,
      title: 'Field Settings',
      template: 'field_dialog',
      ignoreEnter: true
    });
    dialog.promise.then(function () {
      $scope.contentTypeForm.$setDirty();
    });
  };

  $scope.toggleDisableField = function () {
    this.field.disabled = !this.field.disabled;
  };

  $scope.$watchGroup(['field.type', 'field.linkType', 'field.items.type', 'field.items.linkType'], function (values) {
    $scope.fieldType = displayableFieldType.apply(null, values);
  });

  $scope.$watch(function (scope) {
    return scope.contentType.data.displayField === scope.field.id;
  }, function (isTitle) {
    $scope.fieldIsTitle = isTitle;
  });

  function displayableFieldType (type, linkType, itemType, itemLinkType) {
    if (type === 'Array') {
      type = pluralize(itemType);
      linkType = pluralize(itemLinkType);
    }

    return linkType || type;
  }

}]);
