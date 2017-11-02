'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfFieldDisplay
 * @description
 * Displays the content of an entry field.
 *
 * @scope.requires {API.Field} field
 *   The content type field to display value for
 */
.directive('cfFieldDisplay', function () {
  return {
    template: JST.cf_field_display(),
    restrict: 'E',
    replace: true,
    link: function (scope) {
      scope.displayType = function (field) {
        if (field.type === 'Date' && (field.id === 'updatedAt' || field.id === 'createdAt' || field.id === 'publishedAt')) {
          return field.id;
        }

        if (field.type === 'Symbol' && field.id === 'author') {
          return 'author';
        }

        if (field.type === 'Link') {
          return field.linkType;
        }

        return field.type;
      };

      scope.dataForField = function (entry, field) {
        return scope.spaceContext.getFieldValue(entry, field.id);
      };

      function filterVisibleItems (items) {
        var counter = 0;
        var cacheName = hasItemsOfType(items, 'Entry') ? 'entryCache' : 'assetCache';
        var limit = scope[cacheName].params.limit;
        return _.filter(items, function (item) {
          var hasItem = scope[cacheName].has(item.sys.id);
          if (hasItem && counter < limit) {
            counter++;
            return true;
          }
          return false;
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
        if (hasItemsOfType(items, 'Entry')) {
          return _.map(filterVisibleItems(items), function (entry) {
            return scope.dataForEntry(entry);
          });
        }

        if (hasItemsOfType(items, 'Asset')) {
          return _.map(filterVisibleItems(items), function (entry) {
            return scope.dataForAsset(entry, 'data.fields.file');
          });
        }
      };

      /**
       * If the field value is an entry link, return its title.
       *
       * If the link points to a missing entry, return "missing".
       */
      scope.dataForEntry = function (entryLink) {
        var entry = scope.entryCache.get(entryLink.sys.id);
        if (entry) {
          return scope.spaceContext.entryTitle(entry);
        } else {
          return 'missing';
        }
      };

      scope.dataForAsset = function (assetLink) {
        var asset = scope.assetCache.get(assetLink.sys.id);
        return scope.spaceContext.getFieldValue(asset, 'file');
      };

      scope.dataForLinkedEntry = function (entry, field) {
        var entryLinkField = scope.spaceContext.getFieldValue(entry, field.id);
        return entryLinkField ? scope.dataForEntry(entryLinkField) : '';
      };

      scope.dataForLinkedAsset = function (entry, field) {
        var assetLinkField = scope.spaceContext.getFieldValue(entry, field.id);
        return assetLinkField ? scope.dataForAsset(assetLinkField) : '';
      };

      scope.displayBool = function (value) {
        return value ? 'Yes' : 'No';
      };

      scope.displayLocation = function (value) {
        return value ? parseLocation(value.lat) + ', ' + parseLocation(value.lon) : '';
      };

      function parseLocation (val) {
        return _.isNumber(val) ? val.toFixed(4) : 'Invalid value';
      }

      function hasItemsOfType (items, type) {
        return _.get(items, ['0', 'sys', 'linkType']) === type;
      }
    }
  };
});
