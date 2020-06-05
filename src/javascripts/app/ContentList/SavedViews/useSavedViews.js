import createSavedViewsPersistor from './SavedViewsPersistor';
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

const useSavedViews = ({ entityType, viewType, savedViewsUpdated }) => {
  const [state, setState] = useState({ isLoading: true, hasError: false, folders: [] });
  const setAssignState = (state) => setState((prev) => ({ ...prev, ...state }));

  const onUpdate = useCallback((folders) => setAssignState({ folders }), []);
  const savedViewsPersistor = useMemo(() => {
    return createSavedViewsPersistor({
      viewType,
      entityType,
      onUpdate,
    });
  }, [viewType, entityType, onUpdate]);

  useEffect(() => {
    setAssignState({ isLoading: true });
    const loadFolders = async () => {
      try {
        const folders = await savedViewsPersistor.getPreparedScopedFolders();
        setAssignState({ isLoading: false, folders });
      } catch (error) {
        setAssignState({ hasError: true, isLoading: false });
      }
    };
    loadFolders();
  }, [savedViewsPersistor, savedViewsUpdated]);

  return [state, savedViewsPersistor];
};

export default useSavedViews;

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
});
