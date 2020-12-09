import createEntityPageController from 'app/entity_editor/EntityPageController';
import entityPageTemplate from 'app/entity_editor/entity_page.html';
import { AssetView } from '../AssetView';

const list = {
  name: 'list',
  url: '',
  mapInjectedToProps: [
    '$state',
    ($state) => {
      return {
        goTo: (assetId) => {
          // X.list -> X.detail
          $state.go('^.detail', { assetId });
        },
      };
    },
  ],
  component: AssetView,
};

const detail = {
  name: 'detail',
  url: '/:assetId?previousEntries&tab',
  params: { addToContext: true },
  template: entityPageTemplate,
  controller: ['$scope', '$state', createEntityPageController],
};

export const assetViewState = {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [list, detail],
};
