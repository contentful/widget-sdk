'use strict';

angular.module('contentful').controller('EditingInterfaceEditorController', ['$scope', '$injector', function EditingInterfaceEditorController($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var editingInterfaces = $injector.get('editingInterfaces');
  var environment       = $injector.get('environment');

  $controller('AccordionController', {$scope: $scope});

  // TODO this is redundant, the editingInterface contains the contentType id
  $scope.$watch('tab.params.contentType', function (contentType) { $scope.contentType = contentType; });
  $scope.$watch('tab.params.editingInterface', function (editingInterface) { $scope.editingInterface = editingInterface; });
  $scope.$watch('contentType.data.fields', syncWidgets, true);

  $scope.getFieldForWidget = getFieldForWidget;
  $scope.restoreDefaults = restoreDefaults;

  $scope.addStaticWidget = addStaticWidget;
  $scope.removeWidget = removeWidget;

  $scope.update = saveToServer;
  $scope.delete = angular.noop; // TODO: implement when we have more than the default interface

  $scope.$on('contentTypeUnpublished', contentTypeUnpublishedEventHandler);

  this.isWidgetVisible = isWidgetVisible;
  this.layoutElementsEnabled = environment.env !== 'production';

  function isWidgetVisible(widget) {
    if (widget.widgetType === 'static') return true;
    var field = getFieldForWidget(widget);
    return field && (!field.disabled || $scope.preferences.showDisabledFields);
  }

  function getFieldForWidget(widget) {
    return _.find($scope.contentType.data.fields, {id: widget.fieldId});
  }

  function syncWidgets() {
    editingInterfaces.syncWidgets($scope.contentType, $scope.editingInterface);
  }

  function restoreDefaults() {
    $scope.closeAllAccordionItems();
    var editingInterface = editingInterfaces.defaultInterface($scope.contentType);
    $scope.editingInterface.data.widgets = editingInterface.data.widgets;
  }

  function saveToServer() {
    editingInterfaces.save($scope.editingInterface)
    .then(function(interf) {
      $scope.editingInterface = interf;
    })
    .catch(function(error) {
      if (dotty.get(error, 'body.sys.id') == 'VersionMismatch')
        return loadFromServer();
    });
  }

  function loadFromServer () {
    editingInterfaces.forContentTypeWithId($scope.contentType, $scope.editingInterface.getId())
    .then(function(interf) {
      $scope.editingInterface = interf;
    });
  }

  function contentTypeUnpublishedEventHandler(event, contentType) {
    if (contentType === $scope.tab.params.contentType) {
      $scope.tab.close();
    }
  }

  function addStaticWidget(widgetId, itemIndex) {
    var layoutItem = editingInterfaces.staticWidget(widgetId);
    $scope.editingInterface.data.widgets.splice(itemIndex, 0, layoutItem);
  }

  function removeWidget(widgetToRemove) {
    _.remove($scope.editingInterface.data.widgets, function (widget) {
      return widget === widgetToRemove;
    });
  }

}]);
