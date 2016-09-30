'use strict';

angular.module('contentful')

.factory('systemFields', [function () {
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

  var fallbackFields = [
    publishedAt,
    createdAt,
    updatedAt
  ];

  var list = [createdAt, updatedAt, publishedAt, author].map(function (field) {
    return Object.freeze(_.extend(field, {sys: true}));
  });

  var defaultOrder = {
    fieldId: updatedAt.id,
    sys: true,
    direction: 'descending'
  };

  var defaultFields = [
    updatedAt,
    author
  ];

  return {
    getList: _.constant(Object.freeze(list)),
    getDefaultOrder: _.constant(Object.freeze(defaultOrder)),
    getDefaultFields: _.constant(Object.freeze(defaultFields)),
    getFallbackOrderField: getFallbackOrderField
  };

  function getFallbackOrderField (availableFieldIds) {
    return _.find(fallbackFields, function (field) {
      return _.includes(availableFieldIds, field.id);
    }) || {id: undefined};
  }
}]);
