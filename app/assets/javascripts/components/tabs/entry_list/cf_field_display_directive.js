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
        return _.filter(items, function (item) {
          return item.data && item.entityType;
        });
      }

      scope.isEntryArray = function (entity, field) {
        var items = scope.dataForField(entity, field);
        return items && items.length > 0 && items[0].entityType == 'entries';
      };

      scope.isAssetArray = function (entity, field) {
        var items = scope.dataForField(entity, field);
        return items && items.length > 0 && items[0].entityType == 'assets';
      };

      scope.countArrayHiddenItems = function (entity, field) {
        var items = scope.dataForField(entity, field);
        return items && items.length - filterVisibleItems(items).length;
      };

      scope.dataForArray = function (entry, field) {
        var items = scope.dataForField(entry, field);
        if(items && items.length > 0) {
          if(items[0].entityType == 'entries') {
            return _.map(filterVisibleItems(items), function (entry) {
              return scope.dataForEntry(entry);
            });
          }

          if(items[0].entityType == 'assets') {
            return _.map(filterVisibleItems(items), function (entry) {
              return scope.dataForAsset(entry, 'data.fields.file');
            });
          }
        }
      };

      scope.dataForEntry = function (entry) {
        return scope.spaceContext.entryTitle(entry);
      };

      scope.dataForAsset = function (entry) {
        return scope.spaceContext.localizedField(entry, 'data.fields.file');
      };

      scope.dataForLinkedEntry = function (entry, field) {
        var entryField = scope.spaceContext.localizedField(entry, 'data.fields.'+field.id);
        return scope.spaceContext.entryTitle(entryField);
      };

      scope.dataForLinkedAsset = function (entry, field) {
        var assetField = scope.spaceContext.localizedField(entry, 'data.fields.'+field.id);
        return scope.dataForAsset(assetField);
      };

      scope.displayBool = function (value) {
        return value ? 'Yes' : 'No';
      };

    }
  };
});
