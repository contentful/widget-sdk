import { registerFactory } from 'NgRegistry.es6';
import base from 'states/Base.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name states/assets
   */
  registerFactory('states/assets', [
    'app/entity_editor/EntityPageController.es6',
    ({ default: createEntityPageController }) => {
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
}
