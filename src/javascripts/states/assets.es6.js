import base from 'states/Base.es6';
import createEntityPageController from 'app/entity_editor/EntityPageController.es6';

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

export default {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [list, detail]
};
