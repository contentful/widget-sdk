'use strict';

angular.module('contentful').controller('EditingInterfaceEditorController', ['$scope', '$injector', function EditingInterfaceEditorController($scope, $injector) {
  var $controller = $injector.get('$controller');
  var editingInterfaces = $injector.get('editingInterfaces');
  var widgets = $injector.get('widgets');
  var random = $injector.get('random');

  $controller('AccordionController', {$scope: $scope});

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');
  $scope.$watch('tab.params.editingInterface', 'editingInterface=tab.params.editingInterface');
  $scope.$watch('contentType.data.fields', syncWidgets, true);

  $scope.getFieldForWidget = getFieldForWidget;
  $scope.restoreDefaults = restoreDefaults;

  $scope.addLayoutItem = addLayoutItem;
  $scope.removeWidget = removeWidget;

  $scope.update = saveToServer;
  $scope.delete = angular.noop; // TODO: implement when we have more than the default interface

  $scope.$on('entityDeleted', contentTypeDeletedEventHandler);

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
    .catch(function() {
      return loadFromServer();
    });
  }

  function loadFromServer () {
    editingInterfaces.forContentTypeWithId($scope.contentType, $scope.editingInterface.id)
    .then(function(interf) {
      $scope.editingInterface = interf;
    });
  }

  function contentTypeDeletedEventHandler(event, contentType) {
    if (contentType === $scope.tab.params.contentType) {
      $scope.tab.close();
    }
  }

  function addLayoutItem(widgetId, itemIndex) {
    var layoutItem = {
      id: random.id(), // TODO change this to use the field generation method from the service on master
      fieldId: '',
      widgetType: 'static',
      widgetId: widgetId,
      widgetParams: {}
    };

    var widgetOptions = widgets.optionsForWidget(widgetId, 'static');
    _.each(widgetOptions, function (option) {
      layoutItem.widgetParams[option.param] = '';
    });

    $scope.editingInterface.data.widgets.splice(itemIndex, 0, layoutItem);
  }

  function removeWidget(widgetToRemove) {
    _.remove($scope.editingInterface.data.widgets, function (widget) {
      return widget === widgetToRemove;
    });
  }

}]);
