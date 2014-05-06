'use strict';

angular.module('contentful').directive('cfFieldDisplay', function(){
  return {
    template: JST.cf_field_display(),
    restrict: 'E',
    replace: true,
    link: function (scope) {

      scope.displayType = function (field) {
        if(field.type == 'Date' && field.id == 'updatedAt')
          return 'updatedAt';

        if(field.type == 'Symbol' && field.id == 'author')
          return 'author';

        if(field.type == 'Link'){
          return field.linkType;
        }

        return field.type;
      };

      scope.dataForField = function(entry, field) {
        return scope.spaceContext.localizedField(entry, 'data.fields.'+field.id);
      };

      function filterVisibleItems(items) {
        var cacheName = hasItemsOfType(items, 'Entry') ? 'entryCache' : 'assetCache';
        return _.filter(items, function (item) {
          return scope[cacheName].has(item.sys.id);
        });
      }

      scope.isEntryArray = function (entity, field) {
        var items = scope.dataForField(entity, field);
        return hasItemsOfType(items, 'Entry');
      };

      scope.isAssetArray = function (entity, field) {
        var items = scope.dataForField(entity, field);
        return hasItemsOfType(items, 'Asset');
      };

      scope.countArrayHiddenItems = function (entity, field) {
        var items = scope.dataForField(entity, field);
        return items && items.length - filterVisibleItems(items).length;
      };

      scope.dataForArray = function (entry, field) {
        var items = scope.dataForField(entry, field);
        if(hasItemsOfType(items, 'Entry')) {
          return _.map(filterVisibleItems(items), function (entry) {
            return scope.dataForEntry(entry);
          });
        }

        if(hasItemsOfType(items, 'Asset')) {
          return _.map(filterVisibleItems(items), function (entry) {
            return scope.dataForAsset(entry, 'data.fields.file');
          });
        }
      };

      scope.dataForEntry = function (entryLink) {
        var entry = scope.entryCache.get(entryLink.sys.id);
        return scope.spaceContext.entryTitle(entry);
      };

      scope.dataForAsset = function (assetLink) {
        var asset = scope.assetCache.get(assetLink.sys.id);
        return scope.spaceContext.localizedField(asset, 'data.fields.file');
      };

      scope.dataForLinkedEntry = function (entry, field) {
        var entryLinkField = scope.spaceContext.localizedField(entry, 'data.fields.'+field.id);
        return entryLinkField ? scope.dataForEntry(entryLinkField) : '';
      };

      scope.dataForLinkedAsset = function (entry, field) {
        var assetLinkField = scope.spaceContext.localizedField(entry, 'data.fields.'+field.id);
        return assetLinkField ? scope.dataForAsset(assetLinkField) : '';
      };

      scope.displayBool = function (value) {
        return value ? 'Yes' : 'No';
      };

      function hasItemsOfType(items, type){
        return items && items.length > 0 && items[0].sys && items[0].sys.linkType == type;
      }

    }
  };
});
