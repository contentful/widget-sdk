import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import createSavedViewsPersistor from './SavedViewsPersistor';
import SaveCurrentViewDialog from './SaveViewDialog';
import { openRoleSelector } from './RoleSelector';
import * as random from 'utils/Random';
import { forScopedViews as trackingForScopedViews } from 'analytics/events/SearchAndViews';

const styles = {
  wrapper: css({ margin: `0 ${tokens.spacingM}`, whiteSpace: 'nowrap' }),
};

const SavedViewsLink = ({ entityType, onViewSaved, listViewContext }) => {
  const saveCurrentView = async () => {
    const { canEditScopedFolders, getRoleAssignment } = createSavedViewsPersistor({
      entityType,
      viewType: 'shared',
    });

    const canEditShared = canEditScopedFolders();
    const roleAssignment = getRoleAssignment();

    const selectedView = await SaveCurrentViewDialog({
      allowViewTypeSelection: canEditShared,
      allowRoleAssignment: roleAssignment,
    });
    if (!selectedView) {
      return;
    }

    const { title, isShared } = selectedView;
    const viewType = isShared ? 'shared' : 'private';

    const { createScopedFolderView, getDefaultScopedFolder } = createSavedViewsPersistor({
      viewType,
      entityType,
    });

    let roles;
    if (isShared && roleAssignment && canEditShared) {
      const selectedRoles = await openRoleSelector(roleAssignment.endpoint);
      if (selectedRoles !== false) {
        roles = selectedRoles;
      }
    }

    const view = { ...listViewContext.getView(), id: random.id(), title, roles };
    listViewContext.setView(view);
    await createScopedFolderView(view);

    const tracking = trackingForScopedViews(viewType);
    tracking.viewCreated(view, await getDefaultScopedFolder());
    onViewSaved(view, viewType);
  };

  return (
    <TextLink className={styles.wrapper} onClick={saveCurrentView}>
      Save as view
    </TextLink>
  );
};

SavedViewsLink.propTypes = {
  onViewSaved: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['asset', 'entry']).isRequired,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
  }).isRequired,
};

export default SavedViewsLink;
