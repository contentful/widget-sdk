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

      scope.dataForArray = function (entry, field) {
        var items = scope.dataForField(entry, field);
        if(items.length > 0) {
          if(items[0].entityType == 'entries') {
            return _.map(filterVisibleItems(items), function (entry) {
              return scope.spaceContext.entryTitle(entry);
            });
          }

          if(items[0].entityType == 'assets') {
            return _.map(filterVisibleItems(items), function (entry) {
              return scope.spaceContext.assetTitle(entry);
            });
          }
        }
      };

      scope.dataForLink = function (entry, field) {
        return scope.dataForField(entry, field);
      };

      scope.dataForAsset = function (entry, field) {
        return scope.dataForField(entry, field);
      };

      scope.displayBool = function (value) {
        return value ? 'Yes' : 'No';
      };

    }
  };
});
