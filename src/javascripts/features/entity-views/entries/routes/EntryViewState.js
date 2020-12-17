import snapshotsRoute from 'app/snapshots';
import { EntryView } from '../EntryView';
import { entryDetail } from 'app/entity_editor/cfSlideInEditor';

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
    children: [list, entryDetail(withSnapshots ? [snapshotsRoute] : [])],
  };
}
