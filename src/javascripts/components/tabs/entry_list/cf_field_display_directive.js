'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc directive
   * @name cfFieldDisplay
   * @description
   * Displays the content of an entry field.
   *
   * @scope.requires {API.Field} field
   *   The content type field to display value for
   */
  .directive('cfFieldDisplay', () => ({
    template: JST.cf_field_display(),
    restrict: 'E',
    replace: true,

    link: function(scope) {
      scope.displayType = field => {
        if (
          field.type === 'Date' &&
          (field.id === 'updatedAt' || field.id === 'createdAt' || field.id === 'publishedAt')
        ) {
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

      scope.dataForField = (entry, field) => scope.spaceContext.getFieldValue(entry, field.id);

      function filterVisibleItems(items) {
        let counter = 0;
        const cacheName = hasItemsOfType(items, 'Entry') ? 'entryCache' : 'assetCache';
        const limit = scope[cacheName].params.limit;
        return _.filter(items, item => {
          const hasItem = scope[cacheName].has(item.sys.id);
          if (hasItem && counter < limit) {
            counter++;
            return true;
          }
          return false;
        });
      }

      scope.isEntryArray = (entity, field) => {
        const items = scope.dataForField(entity, field);
        return hasItemsOfType(items, 'Entry');
      };

      scope.isAssetArray = (entity, field) => {
        const items = scope.dataForField(entity, field);
        return hasItemsOfType(items, 'Asset');
      };

      scope.countArrayHiddenItems = (entity, field) => {
        const items = scope.dataForField(entity, field);
        return items && items.length - filterVisibleItems(items).length;
      };

      scope.dataForArray = (entry, field) => {
        const items = scope.dataForField(entry, field);
        if (hasItemsOfType(items, 'Entry')) {
          return _.map(filterVisibleItems(items), entry => scope.dataForEntry(entry));
        }

        if (hasItemsOfType(items, 'Asset')) {
          return _.map(filterVisibleItems(items), entry =>
            scope.dataForAsset(entry, 'data.fields.file')
          );
        }
      };

      /**
       * If the field value is an entry link, return its title.
       *
       * If the link points to a missing entry, return "missing".
       */
      scope.dataForEntry = entryLink => {
        const entry = scope.entryCache.get(entryLink.sys.id);
        if (entry) {
          return scope.spaceContext.entryTitle(entry);
        } else {
          return 'missing';
        }
      };

      scope.dataForAsset = assetLink => {
        const asset = scope.assetCache.get(assetLink.sys.id);
        return scope.spaceContext.getFieldValue(asset, 'file');
      };

      scope.dataForLinkedEntry = (entry, field) => {
        const entryLinkField = scope.spaceContext.getFieldValue(entry, field.id);
        return entryLinkField ? scope.dataForEntry(entryLinkField) : '';
      };

      scope.dataForLinkedAsset = (entry, field) => {
        const assetLinkField = scope.spaceContext.getFieldValue(entry, field.id);
        return assetLinkField ? scope.dataForAsset(assetLinkField) : '';
      };

      scope.displayBool = value => (value ? 'Yes' : 'No');

      scope.displayLocation = value =>
        value ? parseLocation(value.lat) + ', ' + parseLocation(value.lon) : '';

      function parseLocation(val) {
        return _.isNumber(val) ? val.toFixed(4) : 'Invalid value';
      }

      function hasItemsOfType(items, type) {
        return _.get(items, ['0', 'sys', 'linkType']) === type;
      }
    }
  }));
