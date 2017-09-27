import {find, get as getAtPath, set as setAtPath} from 'lodash';
import {map, filter, assign, findMap, insertAt, move} from 'utils/Collections';
import {create as createStortable} from 'libs/Sortable';

import random from 'random';

/**
 * @ngdoc service
 * @name app/ContentList/SavedViewsDnD
 * @description
 * Exports a drag-and-drop mechanism for rearranging saved views lists.
 */

/**
 * @ngdoc method
 * @name app/ContentList/SavedViewsDnD#create
 * @description
 * Creates an API for registering DOM nodes that can be dragged and dropped.
 *
 * This function takes two arguments: a scoped UIConfig (with `get` method) and
 * a callback that will be called with updated state of folders.
 *
 * The API has two methods: `forFolders` and `forViews`. They can be safely
 * called with either nodes obtained with the `ref` handler or null (`ref` is
 * called with null when unmounting a node).
 *
 * This service is stateful by maintaing references to nodes used in DnD.
 * This is a deliberate decision. Holding them in a store causes "rerender
 * storms": updating a store with a node triggers rerender causing `ref`
 * handlers to update the store again.
 *
 * @param {UIConfig}  scopedUiConfig  Scoped UIConfig (`forEntries`/`forAssets`)
 * @param {function}  saveFolders     A callback receiving updated folders
 *
 * @returns {object}
 */

export default function create (scopedUiConfig, saveFolders) {
  // Each DnD instance has its own randomly generated view group ID.
  // This way it can be used in many places at the same time, but views can be
  // moved only between the same DnD.
  const viewsGroupId = random.id();

  // A data struture holding references to DOM elements used to create the
  // current state of "libs/Sortable" instances.
  const sortables = {folders: null, views: {}};

  return {forFolders, forViews};

  function forFolders (el) {
    create(['folders'], el, {
      draggable: '.view-folder.-draggable',
      handle: '.view-folder__header',
      filter: '.view-folder__actions, .view-folder__toggle',
      onUpdate: e => saveFolders(moveFolder(scopedUiConfig, e))
    });
  }

  function forViews (el, {id}) {
    create(['views', id], el, {
      draggable: '.-draggable',
      group: `views,${viewsGroupId}`,
      onAdd: e => saveFolders(moveViewBetween(scopedUiConfig, [srcFolder(e), id], e)),
      onUpdate: e => saveFolders(moveView(scopedUiConfig, id, e))
    });
  }

  function srcFolder ({from}) {
    return findMap(sortables.views, (el, key) => el === from ? key : undefined);
  }

  function create (path, el, config) {
    // Create a new instance only if there's a defined, changed element.
    if (el && getAtPath(sortables, path) !== el) {
      setAtPath(sortables, path, el);
      createStortable(el, config);
    }
  }
}

function moveFolder (scopedUiConfig, {oldIndex, newIndex}) {
  // The default folder is not draggable.
  // UiConfig may contain a persisted folder with the "default" ID.
  // `oldIndex` and `newIndex` are not aware of the default folder.
  const foldersWithDefault = scopedUiConfig.get();
  const defaultFolder = find(foldersWithDefault, {id: 'default'});

  // Remove the default folder from the array we're going to rearrange:
  const defaultFolderIndex = foldersWithDefault.indexOf(defaultFolder);
  const folders = filter(foldersWithDefault, (_, i) => i !== defaultFolderIndex);

  // Move the dragged folder:
  const rearranged = move(folders, oldIndex, newIndex);

  // Put the default folder back if it was there initially:
  if (defaultFolder) {
    return insertAt(rearranged, defaultFolderIndex, defaultFolder);
  } else {
    return rearranged;
  }
}

function moveView (scopedUiConfig, folderId, {oldIndex, newIndex}) {
  return map(scopedUiConfig.get(), cur => {
    if (cur.id === folderId) {
      return assign(cur, {views: move(cur.views, oldIndex, newIndex)});
    } else {
      return cur;
    }
  });
}

function moveViewBetween (scopedUiConfig, [srcFolderId, folderId], {oldIndex, newIndex}) {
  const folders = scopedUiConfig.get();
  const view = findMap(folders, cur => {
    if (cur.id === srcFolderId) {
      return cur.views[oldIndex];
    }
  });

  return map(folders, cur => {
    if (cur.id === srcFolderId) {
      return assign(cur, {views: filter(cur.views, (_, i) => i !== oldIndex)});
    } else if (cur.id === folderId) {
      return assign(cur, {views: insertAt(cur.views, newIndex, view)});
    } else {
      return cur;
    }
  });
}
