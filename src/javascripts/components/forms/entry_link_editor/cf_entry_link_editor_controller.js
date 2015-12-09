'use strict';

angular.module('contentful').controller('EntryLinkEditorController', [
  '$scope', '$attrs', '$injector', function ($scope, $attrs, $injector) {

  var controller = this;

  var EntityCache = $injector.get('EntityCache');
  var $controller = $injector.get('$controller');
  $scope.$state   = $injector.get('$state');

  $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Entry',
      fetchMethod: 'getEntries',
      validationType: 'linkContentType',
      multiple: $attrs.linkMultiple
    },
    setValidationType: setValidationType
  });

  // Cache for assets linked from linked entries
  controller.linkedAssetsCache = new EntityCache($scope.spaceContext.space, 'getAssets');

  controller.linkTitle = linkTitle;
  controller.linkDescription = linkDescription;
  controller.entityExists = entityExists;

  $scope.$watch(function () {
    var isDisabled= $scope.isDisabled($scope.field, $scope.locale);
    var linkedCount = dotty.get($scope, 'linkedEntities.length', 0);
    return !isDisabled && linkedCount > 1;
  }, function (isDraggable) {
    $scope.isDraggable = isDraggable;
  });

  $scope.$on('$destroy', function () {
    controller.linkedAssetsCache = null;
  });

  return controller;

  function setValidationType(linkTypeValidation) {
    if (!linkTypeValidation) {
      $scope.linkContentTypes = null;
      return;
    }

    $scope.linkContentTypes = _(linkTypeValidation.contentTypeId)
      .map(function (id) { return $scope.spaceContext.getPublishedContentType(id); })
      .compact()
      .value();

    // TODO This means the validation contains unpublished content  types.
    // It should never happen but I don't know how to deal with it here
    if ($scope.linkContentTypes.length === 0)
      $scope.linkContentTypes = null;
  }

  function linkTitle(entity) {
    if (entityExists(entity)) {
      return $scope.spaceContext.entryTitle(entity, $scope.locale.internal_code);
    } else {
      return '(Missing entity)';
    }
  }

  function linkDescription(entity) {
    if(entityExists(entity)){
      var contentType = $scope.spaceContext.publishedTypeForEntry(entity);
      var field = _.find(contentType.data.fields, function(field){
        return field.id !== contentType.data.displayField && field.type == 'Text';
      });
      if(field)
        return $scope.spaceContext.localizedField(entity, 'data.fields.'+field.id);
    }
    return null;
  }

  function entityExists(entity) {
    return entity && !entity.isMissing && entity.getId();
  }

}]);
