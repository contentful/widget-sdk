import base from 'states/Base';
import createEntityPageController from 'app/entity_editor/EntityPageController';
import entityPageTemplate from 'app/entity_editor/entity_page.html';

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
  template: entityPageTemplate,
  controller: ['$scope', '$state', createEntityPageController]
};

export default {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [list, detail]
};
