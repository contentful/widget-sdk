import base from 'states/Base';
import createEntityPageController from 'app/entity_editor/EntityPageController';
import entityPageTemplate from 'app/entity_editor/entity_page.html';
import snapshotsRoute from 'app/snapshots';
import { EntryView } from '../EntryView';

const list = {
  name: 'list',
  url: '',
  mapInjectedToProps: [
    '$state',
    ($state) => {
      return {
        goTo: (entryId) => {
          // X.list -> X.detail
          $state.go('^.detail', { entryId });
        },
      };
    },
  ],
  component: EntryView,
};

export const entryViewState = {
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
    url: '/:entryId?previousEntries&bulkEditor&tab',
    children: withSnapshots ? [snapshotsRoute] : [],
    params: { addToContext: true },
    template: entityPageTemplate,
    controller: ['$scope', '$state', createEntityPageController],
  });
}
