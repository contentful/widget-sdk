import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TextLink } from '@contentful/forma-36-react-components';
import { showUnpublishedReferencesWarning } from 'app/entity_editor/UnpublishedReferencesWarning';

const styles = {
  wrapper: css({
    marginTop: tokens.spacingM,
  }),
  flexContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingXs,
  }),
  flexItem: css({
    display: 'flex',
    gap: tokens.spacingXs,
  }),
  dropDownListItem: css({
    '> button > span': css({
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacingS,
    }),
  }),
};

const ScheduleWidgetDialogMenu = ({
  entity,
  toggleScheduledActionsDialog,
  isScheduleEntryDialogShown,
  isScheduledActionsFeatureEnabled,
  spaceId,
  environmentId,
}) => {
  const toggleScheduledActionsDialogWithConfirmation = async () => {
    const willScheduleEntryDialogBeShownNext = !isScheduleEntryDialogShown;
    if (willScheduleEntryDialogBeShownNext !== true || entity.sys.type === 'Asset') {
      return toggleScheduledActionsDialog();
    }

    const isConfirmed = await showUnpublishedReferencesWarning({
      entity,
      spaceId,
      environmentId,
      confirmLabel: 'Schedule anyway',
      modalTitle: `Are you sure you want to schedule this ${entity.sys.type.toLowerCase()} to publish?`,
    });

    if (isConfirmed) {
      toggleScheduledActionsDialog();
    }
  };

  const renderMenu = () => {
    if (isScheduledActionsFeatureEnabled) {
      return (
        <TextLink
          icon="Clock"
          testId="schedule-entity-button"
          onClick={toggleScheduledActionsDialogWithConfirmation}>
          Schedule {entity.sys.type.toLowerCase()}
        </TextLink>
      );
    }

    return null;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.flexContainer}>{renderMenu()}</div>
    </div>
  );
};

ScheduleWidgetDialogMenu.propTypes = {
  entity: PropTypes.object.isRequired,
  toggleScheduledActionsDialog: PropTypes.func.isRequired,
  isScheduleEntryDialogShown: PropTypes.bool.isRequired,
  isScheduledActionsFeatureEnabled: PropTypes.bool,
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
};

export { ScheduleWidgetDialogMenu };
