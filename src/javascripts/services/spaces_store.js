'use strict';

angular.module('contentful').service('spacesStore', ['$injector', function($injector) {

  var TheStore    = $injector.get('TheStore');
  var spacesStore = this;

  spacesStore.saveSelectedSpace = function (id) {
    TheStore.set('lastUsedSpace', id);
  };

  spacesStore.getLastUsedSpace = function () {
    return TheStore.get('lastUsedSpace');
  };

  spacesStore.getSpaceFromList = function(id, existingSpaces) {
    return _.find(existingSpaces, function (existingSpace) {
      return existingSpace.getId() === id;
    });
  };

}]);
