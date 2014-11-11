'use strict';

angular.module('contentful').controller('EntryLinkEditorController', [
  '$scope', '$attrs', '$controller', '$injector', function ($scope, $attrs, $controller, $injector) {

  var EntityCache = $injector.get('EntityCache');

  var entryLinkEditorController = $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Entry',
      fetchMethod: 'getEntries',
      validationType: 'linkContentType',
      multiple: $attrs.linkMultiple
    },
    setValidationType: function (linkTypeValidation) {
      $scope.linkContentTypes = _(linkTypeValidation.contentTypeId)
        .map(function (id) { return $scope.spaceContext.getPublishedContentType(id); })
        .compact()
        .value();
      // TODO This means the validation contains unpublished content  types.
      // It should never happen but I don't know how to deal with it here
      if ($scope.linkContentTypes.length === 0) $scope.linkContentTypes = null;
    }
  });

  // Cache for assets linked from linked entries
  entryLinkEditorController.linkedAssetsCache = new EntityCache($scope.spaceContext.space, 'getAssets');

  $scope.$on('$destroy', function () {
    entryLinkEditorController.linkedAssetsCache = null;
  });

  entryLinkEditorController.linkTitle = function(entity) {
    if (entityExists(entity)) {
      return $scope.spaceContext.entryTitle(entity, $scope.locale.code);
    } else {
      return '(Missing entity)';
    }
  };

  entryLinkEditorController.linkDescription = function (entity) {
    if(entityExists(entity)){
      var contentType = $scope.spaceContext.publishedTypeForEntry(entity);
      var field = _.find(contentType.data.fields, function(field){
        return field.id !== contentType.data.displayField && field.type == 'Text';
      });
      if(field)
        return $scope.spaceContext.localizedField(entity, 'data.fields.'+field.id);
    }
    return null;
  };

  entryLinkEditorController.entityExists = entityExists;
  function entityExists(entity) {
    return entity && !entity.isMissing && entity.getId();
  }

  return entryLinkEditorController;

}]);
