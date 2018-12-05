'use strict';

angular
  .module('contentful')

  .factory('systemFields', [
    'require',
    require => {
      var _ = require('lodash');

      var createdAt = {
        id: 'createdAt',
        name: 'Created',
        type: 'Date',
        canPersist: true
      };

      var updatedAt = {
        id: 'updatedAt',
        name: 'Updated',
        type: 'Date',
        canPersist: true
      };

      var publishedAt = {
        id: 'publishedAt',
        name: 'Published',
        type: 'Date',
        canPersist: true
      };

      var author = {
        id: 'author',
        name: 'Author',
        type: 'Symbol'
      };

      var list = [createdAt, updatedAt, publishedAt, author];
      var defaultFields = [updatedAt, author];
      var fallbackFields = [publishedAt, createdAt, updatedAt];

      var defaultOrder = {
        fieldId: updatedAt.id,
        direction: 'descending'
      };

      return {
        getList: returnClone(list),
        getDefaultFieldIds: returnClone(_.map(defaultFields, 'id')),
        getDefaultOrder: returnClone(defaultOrder),
        getFallbackOrderField: getFallbackOrderField
      };

      function returnClone(obj) {
        return () => _.cloneDeep(obj);
      }

      function getFallbackOrderField(availableFieldIds) {
        return (
          _.find(fallbackFields, field => _.includes(availableFieldIds, field.id)) || {
            id: undefined
          }
        );
      }
    }
  ]);
