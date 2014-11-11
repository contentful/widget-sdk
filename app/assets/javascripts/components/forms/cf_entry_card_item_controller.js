'use strict';

angular.module('contentful').controller('EntryCardItemController', ['$scope', function ($scope) {

  var entityExists = $scope.entryLinkController.entityExists;
  var linkedAssetsCache = $scope.entryLinkController.linkedAssetsCache;

  $scope.descriptionLength = $scope.linkMultiple ? 180 : 300;

  $scope.$watch('entity', linkImage);

  function linkImage(entity) {
    if(entityExists(entity)){
      var field = getFirstAssetField(entity);
      var assets = getAssetsFromField(entity, field);

      if(assets && assets.length > 0){
        if(assets.length > 1) assets = assets.slice(0, 1);
        getOrFetchImage(assets);
      }
    }
  }

  function getOrFetchImage(assets) {
    if(linkedAssetsCache.has(assets[0].sys.id)) {
      var asset = linkedAssetsCache.get(assets[0].sys.id);
      $scope.cardImage = $scope.spaceContext.localizedField(asset, 'data.fields.file');
    } else {
      $scope.entryLinkController.lookupEntitiesForCache(assets, linkedAssetsCache).then(function (assets) {
        if(assets.length > 0) $scope.cardImage = $scope.spaceContext.localizedField(assets[0], 'data.fields.file');
      });
    }
  }

  function getFirstAssetField(entity) {
    var contentType = $scope.spaceContext.publishedTypeForEntry(entity);
    return _.find(contentType.data.fields, function(field){
      return field.id !== contentType.data.displayField &&
             (field.type == 'Link'  && field.linkType       == 'Asset' ||
              field.type == 'Array' && field.items.linkType == 'Asset');
    });
  }

  function getAssetsFromField(entity, field) {
    if(field && field.type != 'Array'){
      var asset = $scope.spaceContext.localizedField(entity, 'data.fields.'+field.id);
      if(asset)
        return [asset];
    } else if(field && field.type == 'Array'){
      return $scope.spaceContext.localizedField(entity, 'data.fields.'+field.id);
    }
  }

}]);
