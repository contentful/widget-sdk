import { cloneDeep, omit } from 'lodash';
import * as accessChecker from 'access_control/AccessChecker';

/**
 * If the view has a `roles` property we only return true if the
 * user has one of the roles given.
 *
 * We always return true if the user is an admin or if the view
 * does not have the `roles` property.
 */
const isVisibleForAssignedRoles = (view, membership) => {
  if (!membership.admin && view.roles) {
    return view.roles.some((viewRoleId) => {
      return membership.roles.some((role) => viewRoleId === role.sys.id);
    });
  }
  return true;
};

const isContentTypeReadable = (contentTypeId) => {
  if (typeof contentTypeId === 'string') {
    const can = accessChecker.canPerformActionOnEntryOfType;
    const canRead = can('read', contentTypeId);
    const canCreate = can('create', contentTypeId);

    // If a user can read entries of a specific content type created by
    // themselves ONLY, then calls to `can('read', ctId)` will return `false`.
    // While the return value is correct (a user cannot, in general, read all
    // entries of a type), it causes confusion by hiding views if user's roles
    // contain such a policy. To mitigate that we also check if they can create
    // entries of a given CT.
    return canRead || canCreate;
  } else {
    return true;
  }
};

const isViewVisible = (view, roleAssignment) => {
  if (!view || !isContentTypeReadable(view.contentTypeId)) {
    return false;
  }
  if (roleAssignment) {
    return isVisibleForAssignedRoles(view, roleAssignment.membership);
  }
  return true;
};

export const getVisibleViews = (views = [], roleAssignment) => {
  return views.filter((view) => isViewVisible(view, roleAssignment));
};

export const flattenFolders = (folders) => {
  return folders.reduce((acc, { views, ...folder }) => {
    return [
      ...acc,
      { ...folder, folderId: folder.id, isFolder: true, views },
      ...views.map((view) => ({
        ...view,
        folderId: folder.id,
      })),
    ];
  }, []);
};

export const deflattenFolders = (flattened) => {
  let pointer = 0;
  return flattened.reduce((acc, { isFolder, ...item }) => {
    if (isFolder) {
      if (acc[pointer]) pointer++;
      return [...acc, { ...item, views: [] }];
    }
    const views = [...(acc[pointer]?.views || []), item];
    acc[pointer] = { ...acc[pointer], views };
    return acc;
  }, []);
};

export const sanitizeFolders = (folders) => {
  const temporaryProperties = ['folderId', 'isFolder'];
  return folders.map((folder) => ({
    ...omit(folder, temporaryProperties),
    views: folder.views.map((view) => omit(view, temporaryProperties)),
  }));
};

export const reorderArray = (array, from, to) => {
  const clone = cloneDeep(array);
  const items = clone.splice(from, 1);
  clone.splice(to, 0, ...items);
  return clone;
};

export const initReorder = ({ getPreparedScopedFolders, saveScopedFolders }) => ({
  reorderFolders: async (oldIndex, newIndex) => {
    const folders = await getPreparedScopedFolders();
    const updated = reorderArray(folders, oldIndex, newIndex);
    return saveScopedFolders(updated);
  },
  reorderViews: async (items, oldIndex, newIndex) => {
    const reordered = reorderArray(items, oldIndex, newIndex);
    const folders = deflattenFolders(reordered);
    const updated = sanitizeFolders(folders);
    await saveScopedFolders(updated);
  },
});
