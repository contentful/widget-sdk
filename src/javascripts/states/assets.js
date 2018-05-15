'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/assets
 */
.factory('states/assets', ['require', function (require) {
  var base = require('states/Base').default;
  var createEntityPageController = require('app/entity_editor/EntityPageController').default;

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading media…',
    template: '<div cf-asset-list class="workbench asset-list entity-list"></div>'
  });

  var detail = {
    name: 'detail',
    url: '/:assetId?slideIn',
    params: { addToContext: true },
    template: JST.entity_page(),
    controller: ['$scope', '$state', createEntityPageController]
  };

  return {
    name: 'assets',
    url: '/assets',
    abstract: true,
    children: [list, detail]
  };
}]);
