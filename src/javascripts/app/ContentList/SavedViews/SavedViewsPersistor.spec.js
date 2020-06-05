import { getModule } from 'core/NgRegistry';
import * as random from 'utils/Random';
import createSavedViewsPersistor from './SavedViewsPersistor';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('utils/Random', () => ({ id: jest.fn() }));

let id;
random.id.mockImplementation(() => `${id++}`);

const folders = [{ id: '0', views: [], title: 'Directory' }];

const onUpdate = jest.fn();

const defaultArgs = { entityType: 'entry', viewType: 'shared', onUpdate };

const create = (args = {}) => createSavedViewsPersistor({ ...defaultArgs, ...args });

describe('SavedViewsPersistor', () => {
  let scopedApi;
  const roleAssignment = { membership: 'member', endpoint: 'endpoint' };

  beforeEach(() => {
    id = '1';
    scopedApi = {
      canEdit: true,
      get: jest.fn().mockResolvedValue(folders),
      set: jest.fn().mockResolvedValue(),
    };
    const entityApi = {
      shared: scopedApi,
      private: scopedApi,
    };

    getModule.mockReturnValue({
      space: {
        data: {
          spaceMember: roleAssignment.membership,
        },
      },
      endpoint: roleAssignment.endpoint,
      uiConfig: {
        entries: entityApi,
        assets: entityApi,
      },
    });
  });

  it('should get the role assignment if entry', async () => {
    const persistor = create();
    expect(persistor.getRoleAssignment()).toEqual(roleAssignment);
  });

  it('should get no role assignment if asset', async () => {
    const persistor = create({ entityType: 'asset' });
    expect(persistor.getRoleAssignment()).toBeUndefined();
  });

  it('should return if user canEdit', async () => {
    const persistor = create();
    expect(persistor.canEditScopedFolders()).toBe(true);
    scopedApi.canEdit = false;
    expect(persistor.canEditScopedFolders()).toBe(false);
  });

  it('should return the folders with default folder', async () => {
    const persistor = create();
    expect(await persistor.getPreparedScopedFolders()).toEqual([
      { id: 'default', title: 'Views', views: [] },
      ...folders,
    ]);
  });

  it('should return the folders with sanitized views', async () => {
    scopedApi.get.mockResolvedValue([...folders, { id: 'kaputt', views: ['$$', {}] }]);
    const persistor = create();
    expect(await persistor.getPreparedScopedFolders()).toEqual([
      { id: 'default', title: 'Views', views: [] },
      ...folders,
      { id: 'kaputt', views: [{}] },
    ]);
  });

  it('should reset the folders', async () => {
    const persistor = create();
    await persistor.resetScopedFolders();
    expect(scopedApi.set).toHaveBeenLastCalledWith(undefined);
    expect(onUpdate).toHaveBeenLastCalledWith([
      { id: 'default', title: 'Views', views: [] },
      ...folders,
    ]);
  });

  it('should update the folders', async () => {
    const persistor = create();
    await persistor.updateScopedFolder({ id: '0', title: 'Folder' });
    const result = [
      { id: 'default', title: 'Views', views: [] },
      { id: '0', title: 'Folder', views: [] },
    ];
    expect(scopedApi.set).toHaveBeenLastCalledWith(result);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should not update the folders if not found', async () => {
    const persistor = create();
    await persistor.updateScopedFolder({ id: '-1', title: 'Folder' });
    expect(scopedApi.set).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should create a folder', async () => {
    const persistor = create();
    await persistor.createScopedFolder('New Folder');
    const result = [
      { id: 'default', title: 'Views', views: [] },
      ...folders,
      { id: '1', title: 'New Folder', views: [] },
    ];
    expect(scopedApi.set).toHaveBeenLastCalledWith(result);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should delete a folder', async () => {
    const persistor = create();
    await persistor.deleteScopedFolder({ id: '0' });
    const result = [{ id: 'default', title: 'Views', views: [] }];
    expect(scopedApi.set).toHaveBeenLastCalledWith(result);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should create a folder view', async () => {
    const persistor = create();
    const view = { id: 'view1' };
    await persistor.createScopedFolderView({ id: 'view1' });
    const result = [{ id: 'default', title: 'Views', views: [view] }, ...folders];
    expect(scopedApi.set).toHaveBeenLastCalledWith(result);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should update a folder view', async () => {
    const persistor = create();
    const view = { id: 'view1', title: 'View' };
    scopedApi.get.mockResolvedValue([{ ...folders[0], views: [view] }]);
    const changedView = { id: 'view1', title: 'Changed' };
    await persistor.updateScopedFolderView(changedView);
    const result = [
      { id: 'default', title: 'Views', views: [] },
      { ...folders[0], views: [changedView] },
    ];
    expect(scopedApi.set).toHaveBeenLastCalledWith(result);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should not update the folder view if not found', async () => {
    const persistor = create();
    await persistor.updateScopedFolderView({ id: '-1', title: 'Folder' });
    expect(scopedApi.set).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should delete a folder view', async () => {
    const persistor = create();
    const view = { id: 'view1', title: 'View' };
    scopedApi.get.mockResolvedValue([{ ...folders[0], views: [view] }]);
    await persistor.deleteScopedFolderView(view);
    const result = [{ id: 'default', title: 'Views', views: [] }, ...folders];
    expect(scopedApi.set).toHaveBeenLastCalledWith(result);
    expect(onUpdate).toHaveBeenCalled();
  });
});
