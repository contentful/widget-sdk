import React, { useState } from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import {
  Dropdown,
  Tooltip,
  DropdownListItem,
  DropdownList,
  Button,
  Icon,
} from '@contentful/forma-36-react-components';
import CommandPropType from 'app/entity_editor/CommandPropType';
import RestrictedAction from './RestrictedAction';
import ActionRestrictedNote from './ActionRestrictedNote';

const styles = {
  scheduleListItem: css({
    lineHeight: tokens.spacingM,
    display: 'flex',
    alignItems: 'center',
    borderTop: `1px solid ${tokens.colorElementMid}`,
    marginBottom: `-${tokens.spacingS}`,
    '> button': {
      height: '2.5rem',
    },
  }),
  scheduleListItemInnerWrapper: css({
    lineHeight: tokens.spacingM,
    display: 'flex',
    alignItems: 'center',
  }),
  scheduledIcon: css({
    marginRight: tokens.spacing2Xs,
  }),
  switchContainer: css({
    display: 'flex',
  }),
  switchButton: css({
    marginLeft: tokens.spacingM,
  }),
  publishButton: css({
    minWidth: '170px',
  }),
  dropdown: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  dropdownItem: css({
    width: tokens.contentWidthFull,
    '& > *': {
      textAlign: 'center',
    },
    '& div': {
      justifyContent: 'center',
    },
  }),
  statusScheduledIcon: css({
    verticalAlign: 'sub',
  }),
};

const statusSwitchPropsByEntityStatus = {
  archived: {
    tagType: 'negative',
    background: tokens.colorRedBase,
    backgroundHover: tokens.colorRedDark,
    title: 'Archived',
  },
  draft: {
    tagType: 'warning',
    background: tokens.colorOrangeBase,
    backgroundHover: tokens.colorOrangeDark,
    title: 'Draft',
  },
  published: {
    tagType: 'positive',
    background: tokens.colorGreenBase,
    backgroundHover: tokens.colorGreenDark,
    title: 'Published',
  },
  changes: {
    tagType: 'primaryAction',
    background: tokens.colorBlueBase,
    backgroundHover: tokens.colorBlueDark,
    title: 'Changed',
  },
};

const primaryActionButtonPropsByEntityStatus = {
  archived: {
    tagType: 'negative',
    background: tokens.colorRedBase,
    backgroundHover: tokens.colorRedDark,
    title: 'Archive',
  },
  draft: {
    tagType: 'warning',
    background: tokens.colorOrangeBase,
    backgroundHover: tokens.colorOrangeDark,
    title: 'Unarchive',
  },
  published: {
    tagType: 'positive',
    background: tokens.colorGreenBase,
    backgroundHover: tokens.colorGreenDark,
    title: 'Publish',
  },
};

const StatusSwitch = ({
  primaryAction,
  status,
  isSaving,
  secondaryActions,
  isDisabled,
  publicationBlockedReason,
  isScheduled,
  isScheduledPublishDisabled,
  onScheduledPublishClick,
  withScheduling,
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  // action.execute does not trigger re-rendering if Cancel is selected in the modal
  const [isActionInProgress, setActionInProgress] = useState(false);
  const currentStatusProps = statusSwitchPropsByEntityStatus[status] || {};
  const primaryActionProps =
    primaryActionButtonPropsByEntityStatus[primaryAction.targetStateId] || {};

  const isPrimaryActionDisabled =
    primaryAction.isRestricted() ||
    primaryAction.isDisabled() ||
    isDisabled ||
    (primaryAction.targetStateId === 'published' && !!publicationBlockedReason);

  // https://github.com/contentful/user_interface/pull/5572#issuecomment-599437862
  const avilableSecondaryActions =
    status === 'archived'
      ? secondaryActions.filter((action) => action.targetStateId !== 'published')
      : secondaryActions;

  const allActionsRestricted = [primaryAction, ...avilableSecondaryActions]
    // when published, primary action becomes a stub with isAvailable() true,
    // isDisabled() false, isRestricted() false, but also without any way to execute it
    // or change the status, so a stub
    .filter((action) => !!action.targetStateId)
    .every((action) => action.isDisabled() || action.isRestricted());

  const isButtonLocked = !!(publicationBlockedReason || allActionsRestricted);
  const lockReason = publicationBlockedReason || 'You do not have permission to change status';

  // overwriting forma 36 button component styles to make it flat instead of gradient
  const statusButtonStyle = css({
    letterSpacing: '.1rem',
    textTransform: 'uppercase',
    backgroundImage: 'none',
    backgroundColor: currentStatusProps.background,
    borderColor: currentStatusProps.background,
    '& span': {
      color: tokens.colorWhite,
    },
    '&:hover': {
      borderColor: currentStatusProps.background,
      backgroundColor: currentStatusProps.backgroundHover,
    },
  });

  const primaryActionButton = css({
    backgroundImage: 'none',
    backgroundColor: primaryActionProps.background,
    borderColor: primaryActionProps.background,
    '&:hover': {
      borderColor: primaryActionProps.background,
      backgroundColor: primaryActionProps.backgroundHover,
    },
  });

  const renderScheduledPublicationCta = (isButtonLocked) => {
    // disabled by the parent component (e.g. error during jobs fetching)
    if (isScheduledPublishDisabled || primaryAction.isRestricted()) {
      return null;
    }

    return (
      <DropdownListItem
        className={cx(styles.scheduleListItem, styles.dropdownItem)}
        testId="schedule-publication"
        isDisabled={isButtonLocked || !!publicationBlockedReason || status === 'archived'}
        onClick={() => {
          onScheduledPublishClick();
          setDropdownOpen(false);
        }}>
        <div className={styles.scheduleListItemInnerWrapper}>
          <Icon icon="Clock" color="muted" className={styles.scheduledIcon} />
          Set Schedule
        </div>
      </DropdownListItem>
    );
  };

  return (
    <div className={styles.switchContainer} data-test-id="status-widget">
      <div className={cx('publish-buttons-row', styles.switchButton)}>
        <Dropdown
          className="secondaryActions-publish-button-wrapper"
          position="bottom-right"
          isOpen={isDropdownOpen}
          onClose={() => {
            setDropdownOpen(false);
          }}
          toggleElement={
            <Button
              disabled={isSaving || isActionInProgress}
              testId="change-state-menu-trigger"
              buttonType={currentStatusProps.tagType}
              indicateDropdown={!isButtonLocked}
              loading={isSaving || isActionInProgress}
              className={statusButtonStyle}
              onClick={() => {
                if (!isButtonLocked) {
                  setDropdownOpen(!isDropdownOpen);
                }
              }}>
              {isButtonLocked && (
                <Tooltip content={<ActionRestrictedNote reason={lockReason} />}>
                  <Icon
                    icon="Lock"
                    color="white"
                    className={cx(styles.scheduledIcon, styles.statusScheduledIcon)}
                  />
                </Tooltip>
              )}
              {isScheduled && !isButtonLocked && (
                <Icon
                  icon="Clock"
                  color="white"
                  className={cx(styles.scheduledIcon, styles.statusScheduledIcon)}
                />
              )}
              {currentStatusProps.title}
            </Button>
          }>
          <DropdownList className={styles.dropdown} testId="change-state-menu">
            {primaryAction && primaryAction.targetStateId && (
              <DropdownListItem>
                <Button
                  className={cx(styles.publishButton, primaryActionButton)}
                  testId="force-publish-menu-trigger"
                  buttonType={primaryActionProps.tagType}
                  disabled={isPrimaryActionDisabled}
                  icon={isPrimaryActionDisabled ? 'Lock' : undefined}
                  isFullWidth
                  onClick={async () => {
                    setDropdownOpen(false);
                    setActionInProgress(true);
                    await primaryAction.execute();
                    setActionInProgress(false);
                  }}>
                  {primaryActionProps.title}
                </Button>
              </DropdownListItem>
            )}
            {avilableSecondaryActions &&
              avilableSecondaryActions.map(
                (action) =>
                  action.isAvailable() && (
                    <DropdownListItem
                      className={styles.dropdownItem}
                      key={action.label}
                      testId={`change-state-${action.targetStateId}`}
                      onClick={async () => {
                        setDropdownOpen(false);
                        setActionInProgress(true);
                        await action.execute();
                        setActionInProgress(false);
                      }}
                      icon={action.isDisabled() ? 'Lock' : undefined}
                      isDisabled={action.isDisabled()}>
                      {action.isRestricted() ? (
                        <RestrictedAction actionName={action.label} />
                      ) : (
                        action.label
                      )}
                    </DropdownListItem>
                  )
              )}
            {withScheduling &&
              renderScheduledPublicationCta &&
              renderScheduledPublicationCta(isButtonLocked)}
          </DropdownList>
        </Dropdown>
      </div>
    </div>
  );
};

StatusSwitch.propTypes = {
  status: PropTypes.string.isRequired,
  isSaving: PropTypes.bool.isRequired,
  isScheduled: PropTypes.bool,
  primaryAction: CommandPropType,
  secondaryActions: PropTypes.arrayOf(CommandPropType.isRequired).isRequired,
  isDisabled: PropTypes.bool.isRequired,
  publicationBlockedReason: PropTypes.string,
  renderScheduledPublicationCta: PropTypes.func,
  isScheduledPublishDisabled: PropTypes.bool,
  onScheduledPublishClick: PropTypes.func,
  withScheduling: PropTypes.bool.isRequired,
};

export default StatusSwitch;
