import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import createListViewPersistor from 'data/ListViewPersistor';
import createSavedViewsPersistor from './SavedViewsPersistor';
import SaveCurrentViewDialog from './SaveViewDialog';
import { openRoleSelector } from './RoleSelector';
import * as random from 'utils/Random';
import { forScopedViews as trackingForScopedViews } from 'analytics/events/SearchAndViews';

const styles = {
  wrapper: css({ marginLeft: tokens.spacingM }),
};

const SavedViewsLink = ({ entityType, onViewSaved }) => {
  const listViewPersistor = createListViewPersistor({ entityType });

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
      onUpdate: () => onViewSaved(viewType),
    });

    let roles;
    if (isShared && roleAssignment && canEditShared) {
      const selectedRoles = await openRoleSelector(roleAssignment.endpoint);
      if (selectedRoles !== false) {
        roles = selectedRoles;
      }
    }

    const view = { ...listViewPersistor.read(), id: random.id(), title, roles };
    listViewPersistor.save(view);
    await createScopedFolderView(view);

    const tracking = trackingForScopedViews(viewType);
    tracking.viewCreated(view, await getDefaultScopedFolder());
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
};

export default SavedViewsLink;
