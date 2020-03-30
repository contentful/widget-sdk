import _ from 'lodash';
import base from 'states/Base';
import createEntityPageController from 'app/entity_editor/EntityPageController';
import entityPageTemplate from 'app/entity_editor/entity_page.html';
import snapshotsRoute from 'app/snapshots';

const list = base({
  name: 'list',
  url: '',
  loadingText: 'Loading content…',
  template: '<div cf-entry-list class="workbench entry-list entity-list"></div>',
});

export default {
  withSnapshots: entriesBaseState(true),
  withoutSnapshots: entriesBaseState(false),
};

function entriesBaseState(withSnapshots) {
  return {
    name: 'entries',
    url: '/entries',
    abstract: true,
    children: [list, detail(withSnapshots)],
  };
}

function detail(withSnapshots) {
  return base({
    name: 'detail',
    url: '/:entryId?previousEntries&bulkEditor',
    children: withSnapshots ? [snapshotsRoute] : [],
    params: { addToContext: true },
    template: entityPageTemplate,
    controller: ['$scope', '$state', createEntityPageController],
  });
}
