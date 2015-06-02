'use strict';

angular.module('contentful').service('iconMetadataStore', [function() {
  var iconMetadataStore = this;

  iconMetadataStore.set = function (metadata) {
    iconMetadataStore._metadata = metadata;
  };

  iconMetadataStore.get = function (id) {
    return iconMetadataStore._metadata[id];
  };

  iconMetadataStore.getAll = function () {
    return iconMetadataStore._metadata;
  };
}]);
