import { isPlainObject, noop } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import pluralize from 'pluralize';
import { makeBlankFolder } from 'data/UiConfig/Blanks';
import { getSpaceContext } from 'classes/spaceContext';
import { forScopedViews as tracking } from 'analytics/events/SearchAndViews';

const DEFAULT_ID = 'default';

const ensureValidViews = (folders) => {
  return folders.map(({ views = [], ...folder }) => ({
    ...folder,
    views: views.filter(isPlainObject),
  }));
};

export const createSavedViewsPersistor = ({ entityType, viewType, onUpdate = noop }) => {
  const spaceContext = getSpaceContext();
  const entityApi = spaceContext.uiConfig[pluralize(entityType)];
  const scopedApi = entityApi[viewType];

  const canEditScopedFolders = () => scopedApi.canEdit;
  const getScopedFolders = () => scopedApi.get();

  const trackingForScopedViews = tracking(viewType);

  const getRoleAssignment = () => {
    if (entityType === 'entry' && viewType === 'shared') {
      return {
        membership: spaceContext.space.data.spaceMember,
        endpoint: spaceContext.endpoint,
      };
    }
  };

  const getPreparedScopedFolders = async () => {
    const folders = await getScopedFolders();
    const notHasDefault = !folders.some(({ id }) => id === DEFAULT_ID);
    let results = folders;
    if (notHasDefault) {
      const defaultFolder = makeBlankFolder({ id: DEFAULT_ID, title: 'Views' });
      results = [defaultFolder, ...folders];
    }
    return ensureValidViews(results);
  };

  const resetScopedFolders = async () => {
    await scopedApi.set(undefined);
    const folders = await getPreparedScopedFolders();
    onUpdate(folders);
  };

  const findContainingFolderByView = async (view) => {
    const folders = await getPreparedScopedFolders();
    return folders.find(({ views }) => views.some(({ id }) => id === view.id));
  };

  const saveScopedFolders = async (updatedFolders) => {
    // We display this notification w/o confirming changes were successfully
    // persisted. If it fails, consecutive notification is presented and the
    // state is reverted.
    onUpdate(updatedFolders);
    Notification.success('View(s) updated successfully.');

    try {
      await scopedApi.set(updatedFolders);
    } catch (error) {
      Notification.error('Error while updating saved views. Your changes were reverted.');
    }

    // Calling `scopedFolders.set()` updates the local version of the UiConfig
    // right away. `scopedFolders.get()` will return it w/o waiting for the API
    // roundtrip. It returns defaults if the local version is `undefined`.
    const folders = await getPreparedScopedFolders();
    onUpdate(folders);
  };

  const createScopedFolder = async (title) => {
    const newFolder = makeBlankFolder({ title });
    const folders = await getPreparedScopedFolders();
    const updated = [...folders, newFolder];
    return saveScopedFolders(updated);
  };

  const getScopedFolder = async (id) => {
    const folders = await getPreparedScopedFolders();
    return folders.find((folder) => folder.id === id);
  };

  const getDefaultScopedFolder = () => {
    return getScopedFolder(DEFAULT_ID);
  };

  const updateScopedFolder = async (updatedFolder) => {
    const folders = await getPreparedScopedFolders();
    const foundFolder = folders.find(({ id }) => id === updatedFolder.id);
    if (foundFolder) {
      const updated = folders.map((folder) =>
        folder.id === foundFolder.id ? { ...folder, ...updatedFolder } : folder
      );
      return saveScopedFolders(updated);
    }
  };

  const deleteScopedFolder = async ({ id }) => {
    const folders = await getPreparedScopedFolders();
    const updated = folders.filter((folder) => folder.id !== id);
    return saveScopedFolders(updated);
  };

  const createScopedFolderView = async (view) => {
    const folders = await getPreparedScopedFolders();
    const foundFolder = folders.find(({ id }) => id === DEFAULT_ID);
    if (foundFolder) {
      const views = [...foundFolder.views, view];
      const updated = folders.map((folder) =>
        folder.id === foundFolder.id ? { ...foundFolder, views } : folder
      );
      return saveScopedFolders(updated);
    }
  };

  const updateScopedFolderView = async (updatedView) => {
    const folders = await getPreparedScopedFolders();
    const foundFolder = await findContainingFolderByView(updatedView);
    if (foundFolder) {
      const foundView = foundFolder.views.find(({ id }) => id === updatedView.id);
      if (foundView) {
        const views = foundFolder.views.map((view) =>
          view.id === foundView.id ? { ...foundView, ...updatedView } : view
        );
        const updated = folders.map((folder) =>
          folder.id === foundFolder.id ? { ...foundFolder, views } : folder
        );
        return saveScopedFolders(updated);
      }
    }
  };

  const deleteScopedFolderView = async (view) => {
    const folders = await getPreparedScopedFolders();
    const foundFolder = await findContainingFolderByView(view);
    if (foundFolder) {
      const views = foundFolder.views.filter(({ id }) => id !== view.id);
      const updated = folders.map((folder) =>
        folder.id === foundFolder.id ? { ...foundFolder, views } : folder
      );
      return saveScopedFolders(updated);
    }
  };

  return {
    trackingForScopedViews,
    getRoleAssignment,
    resetScopedFolders,
    canEditScopedFolders,
    getPreparedScopedFolders,
    createScopedFolder,
    getDefaultScopedFolder,
    updateScopedFolder,
    deleteScopedFolder,
    createScopedFolderView,
    updateScopedFolderView,
    deleteScopedFolderView,
    saveScopedFolders,
  };
};
