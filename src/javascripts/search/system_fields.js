'use strict';

angular.module('contentful').factory('systemFields', [function () {

  var createdAtField = {
    id: 'createdAt',
    name: 'Created',
    type: 'Date',
    sys: true,
    canPersist: true
  };

  var updatedAtField = {
    id: 'updatedAt',
    name: 'Updated',
    type: 'Date',
    sys: true,
    canPersist: true
  };

  var publishedAtField = {
    id: 'publishedAt',
    name: 'Published',
    type: 'Date',
    sys: true,
    canPersist: true
  };

  var authorField = {
    id: 'author',
    name: 'Author',
    type: 'Symbol',
    sys: true
  };

  var map = {
    updatedAt:   updatedAtField,
    createdAt:   createdAtField,
    publishedAt: publishedAtField,
    author:      authorField
  };

  var list = [
    updatedAtField,
    createdAtField,
    publishedAtField,
    authorField
  ];

  var defaultOrder = {
    fieldId:   updatedAtField.id,
    direction: 'descending'
  };

  return {
    get: function (name) { return map[name]; },
    getList: _.constant(list),
    // we clone the object so UI manipulation won't change defaults
    getDefaultOrder: function () { return _.clone(defaultOrder); }
  };
}]);
