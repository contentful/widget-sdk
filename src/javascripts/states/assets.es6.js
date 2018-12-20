'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/assets
   */
  .factory('states/assets', [
    'require',
    require => {
      const base = require('states/Base.es6').default;
      const createEntityPageController = require('app/entity_editor/EntityPageController.es6')
        .default;

      const list = base({
        name: 'list',
        url: '',
        loadingText: 'Loading media…',
        template: '<div cf-asset-list class="workbench asset-list entity-list"></div>'
      });

      const detail = {
        name: 'detail',
        url: '/:assetId?previousEntries',
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
    }
  ]);
