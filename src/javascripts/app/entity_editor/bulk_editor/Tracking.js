import { partial, size, noop } from 'lodash';
import * as Analytics from 'analytics/Analytics';
import * as K from 'core/utils/kefir';
import { State } from 'data/CMA/EntityState';

export function create(parentEntryId, links$) {
  const editedEntries = {};
  const publishedEntries = {};

  return {
    open,
    close,
    addExisting,
    addNew,
    changeStatus,
    edited,
    actions,
  };

  function open() {
    track('open', {
      refCount: K.getValue(links$).length,
    });
  }

  function close() {
    track('close', {
      refCount: K.getValue(links$).length,
      numEditedEntries: size(editedEntries),
      numPublishedEntries: size(publishedEntries),
    });
  }

  function addExisting(num) {
    track('add', {
      refCount: K.getValue(links$).length + num,
      existing: true,
    });
  }

  function addNew() {
    track('add', {
      refCount: K.getValue(links$).length + 1,
      existing: false,
    });
  }

  function actions(entryId) {
    return {
      openInEntryEditor: partial(trackAction, 'edit_in_entry_editor', entryId),
      unlink: partial(trackAction, 'unlink', entryId),
      navigate: partial(trackAction, 'navigate', entryId), // TODO: Still relevant?
      setExpansion(expanded) {
        const action = expanded ? 'expand' : 'collapse';
        trackAction(action, entryId);
      },
    };
  }

  function trackAction(action, entryId) {
    track(action, {
      refCount: K.getValue(links$).length + 1,
      entryId,
    });
  }

  function changeStatus(id, state) {
    if (state === State.Published()) {
      publishedEntries[id] = true;
    }
    track('status', {
      entryId: id,
      status: state,
    });
  }

  function edited(id) {
    editedEntries[id] = true;
  }

  function track(name, options) {
    Analytics.track(`bulk_editor:${name}`, { parentEntryId, ...options });
  }
}

export const createNoop = () => ({
  open: noop,
  close: noop,
  addExisting: noop,
  addNew: noop,
  changeStatus: noop,
  edited: noop,
  actions: () => ({
    unlink: noop,
    navigate: noop,
    setExpansion: noop,
  }),
});
