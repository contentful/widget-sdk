import createEntityPageController from 'app/entity_editor/EntityPageController';
import entityPageTemplate from 'app/entity_editor/entity_page.html';
import Assets from 'components/tabs/asset_list/AssetView';

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
  component: Assets,
};

const detail = {
  name: 'detail',
  url: '/:assetId?previousEntries',
  params: { addToContext: true },
  template: entityPageTemplate,
  controller: ['$scope', '$state', createEntityPageController],
};

export default {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [list, detail],
};
