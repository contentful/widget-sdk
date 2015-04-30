'use strict';

angular.module('contentful').service('spacesStore', [function() {

  var spacesStore = this;

  spacesStore.saveSelectedSpace = function (id) {
    $.cookies.set('lastUsedSpace', id, {
      expiresAt: moment().add('y', 1).toDate()
    });
  };

  spacesStore.getLastUsedSpace = function () {
    return $.cookies.get('lastUsedSpace');
  };

  spacesStore.getSpaceFromList = function(id, existingSpaces) {
    return _.find(existingSpaces, function (existingSpace) {
      return existingSpace.getId() === id;
    });
  };

}]);
