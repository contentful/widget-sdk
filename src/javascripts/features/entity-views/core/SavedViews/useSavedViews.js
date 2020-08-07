import { createSavedViewsPersistor } from './SavedViewsPersistor';
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

export const useSavedViews = ({ entityType, viewType }) => {
  const [state, setState] = useState({ isLoading: true, hasError: false, folders: [] });
  const setAssignState = (state) => setState((prev) => ({ ...prev, ...state }));

  const setFolders = useCallback((folders) => setAssignState({ folders }), []);
  const savedViewsPersistor = useMemo(() => {
    return createSavedViewsPersistor({
      viewType,
      entityType,
      onUpdate: setFolders,
    });
  }, [viewType, entityType, setFolders]);

  const fetchFolders = useCallback(async () => {
    setAssignState({ isLoading: true });
    try {
      const folders = await savedViewsPersistor.getPreparedScopedFolders();
      setAssignState({ isLoading: false, folders });
    } catch (error) {
      setAssignState({ hasError: true, isLoading: false });
    }
  }, [savedViewsPersistor]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return [state, { ...savedViewsPersistor, fetchFolders, setFolders }];
};

export const savedViewsActionsPropTypes = PropTypes.shape({
  trackingForScopedViews: PropTypes.object.isRequired,
  getRoleAssignment: PropTypes.func.isRequired,
  resetScopedFolders: PropTypes.func.isRequired,
  canEditScopedFolders: PropTypes.func.isRequired,
  getPreparedScopedFolders: PropTypes.func.isRequired,
  createScopedFolder: PropTypes.func.isRequired,
  getDefaultScopedFolder: PropTypes.func.isRequired,
  updateScopedFolder: PropTypes.func.isRequired,
  deleteScopedFolder: PropTypes.func.isRequired,
  createScopedFolderView: PropTypes.func.isRequired,
  updateScopedFolderView: PropTypes.func.isRequired,
  deleteScopedFolderView: PropTypes.func.isRequired,
  saveScopedFolders: PropTypes.func.isRequired,
  fetchFolders: PropTypes.func.isRequired,
  setFolders: PropTypes.func.isRequired,
});
