import React from 'react';
import PropTypes from 'prop-types';
import { every } from 'lodash';
import { css, cx } from 'emotion';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TextLink,
  Icon,
  Subheading
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import RelativeTimeData from 'components/shared/RelativeDateTime';

import ActionRestrictedNote from './ActionRestrictedNote';
import RestrictedAction from './RestrictedAction';

import CommandPropType from 'app/entity_editor/CommandPropType';
import StatusBadge from 'app/EntrySidebar/PublicationWidget/StatusBadge';

import StatusSwitchPortal from './StatusSwitchPortal';
import StatusSwitch from './StatusSwitch';

// TODO: This code started as a copy of <PublicationWidget />, there should be
//  some shared code as there are still a lot of similarities.

const styles = {
  scheduleListItem: css({
    lineHeight: '1rem',
    display: 'flex',
    alignItems: 'center',
    borderTop: `1px solid ${tokens.colorElementMid}`,
    marginBottom: `-${tokens.spacingS}`,
    '> button': {
      height: '2.5rem'
    }
  }),
  scheduleListItemInnerWrapper: css({
    lineHeight: '1rem',
    display: 'flex',
    alignItems: 'center'
  }),
  scheduledIcon: css({
    marginRight: tokens.spacing2Xs
  }),
  sidebarHeading: css({
    display: 'flex'
  }),
  sidebarHeadingStatus: css({
    marginRight: 'auto'
  }),
  dropdownItem: css({
    width: tokens.contentWidthFull,
    '& > *': {
      textAlign: 'center'
    },
    '& div': {
      justifyContent: 'center'
    }
  })
};

class StatusWidget extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isOpenDropdown: false
    };
  }

  renderScheduledPublicationCta = isButtonLocked => {
    // disabled by the parent component (e.g. error during jobs fetching)
    if (this.props.isScheduledPublishDisabled || this.props.primary.isRestricted()) {
      return null;
    }

    const { isStatusSwitch } = this.props;

    return (
      <DropdownListItem
        className={
          isStatusSwitch
            ? cx(styles.scheduleListItem, styles.dropdownItem)
            : styles.scheduleListItem
        }
        testId="schedule-publication"
        isDisabled={
          isButtonLocked ||
          !!this.props.publicationBlockedReason ||
          this.props.status === 'archived'
        }
        onClick={() => {
          this.props.onScheduledPublishClick();
          this.setState({ isOpenDropdown: false });
        }}>
        <div className={styles.scheduleListItemInnerWrapper}>
          <Icon icon="Clock" color="muted" className={styles.scheduledIcon} />
          Set Schedule
        </div>
      </DropdownListItem>
    );
  };

  canSchedule = () => {
    return this.props.status === 'draft' || this.props.status === 'changes';
  };

  render() {
    const {
      primary,
      status,
      secondary,
      isSaving,
      updatedAt,
      revert,
      isDisabled,
      isScheduled,
      publicationBlockedReason,
      entity,
      isStatusSwitch,
      onScheduledPublishClick,
      isScheduledPublishDisabled
    } = this.props;

    if (isStatusSwitch) {
      return (
        <StatusSwitchPortal entityId={entity.sys.id}>
          <StatusSwitch
            primaryAction={primary}
            status={status}
            isSaving={isSaving}
            secondaryActions={secondary}
            isDisabled={isDisabled}
            publicationBlockedReason={publicationBlockedReason}
            isScheduled={isScheduled}
            onScheduledPublishClick={onScheduledPublishClick}
            isScheduledPublishDisabled={isScheduledPublishDisabled}
            withScheduling={true}
          />
        </StatusSwitchPortal>
      );
    }

    const secondaryActionsDisabled =
      every(secondary || [], action => action.isDisabled()) && !this.canSchedule();

    return (
      <div data-test-id="status-widget">
        <header className="entity-sidebar__header">
          <Subheading className={cx('entity-sidebar__heading', styles.sidebarHeading)}>
            <span className={styles.sidebarHeadingStatus}>Status</span>
          </Subheading>
        </header>
        <div className="entity-sidebar__state-select">
          <StatusBadge status={status} isScheduled={isScheduled} />
          <div className="publish-buttons-row">
            {status !== 'published' && primary && (
              <Button
                isFullWidth
                buttonType="positive"
                disabled={
                  primary.isDisabled() ||
                  isDisabled ||
                  (primary.targetStateId === 'published' && !!publicationBlockedReason)
                }
                loading={primary.inProgress()}
                testId={`change-state-${primary.targetStateId}`}
                onClick={() => {
                  primary.execute();
                }}
                className="primary-publish-button">
                {primary.label}
              </Button>
            )}
            <Dropdown
              className="secondary-publish-button-wrapper"
              position="bottom-right"
              isOpen={this.state.isOpenDropdown}
              onClose={() => {
                this.setState({ isOpenDropdown: false });
              }}
              toggleElement={
                <Button
                  className="secondary-publish-button"
                  isFullWidth
                  disabled={isDisabled || secondaryActionsDisabled}
                  testId="change-state-menu-trigger"
                  buttonType="positive"
                  indicateDropdown
                  onClick={() => {
                    this.setState(state => ({ isOpenDropdown: !state.isOpenDropdown }));
                  }}>
                  {status === 'published' ? 'Change status' : ''}
                </Button>
              }>
              <DropdownList testId="change-state-menu">
                <DropdownListItem isTitle>Change status to</DropdownListItem>
                {secondary &&
                  secondary.map(
                    action =>
                      action.isAvailable() && (
                        <DropdownListItem
                          key={action.label}
                          testId={`change-state-${action.targetStateId}`}
                          onClick={() => {
                            action.execute();
                            this.setState({ isOpenDropdown: false });
                          }}
                          isDisabled={action.isDisabled()}>
                          {action.isRestricted() ? (
                            <RestrictedAction actionName={action.label} />
                          ) : (
                            action.label
                          )}
                        </DropdownListItem>
                      )
                  )}
                {this.renderScheduledPublicationCta()}
              </DropdownList>
            </Dropdown>
          </div>
          {primary && primary.isRestricted() ? (
            <ActionRestrictedNote actionName={primary.label} />
          ) : (
            primary.targetStateId === 'published' &&
            publicationBlockedReason && <ActionRestrictedNote reason={publicationBlockedReason} />
          )}
        </div>
        <div className="entity-sidebar__status-more">
          {updatedAt && (
            <div className="entity-sidebar__save-status">
              <i
                className={cx('entity-sidebar__saving-spinner', {
                  'x--active': isSaving
                })}
              />
              <span className="entity-sidebar__last-saved" data-test-id="last-saved">
                Last saved <RelativeTimeData value={updatedAt} />
              </span>
            </div>
          )}
          {revert && revert.isAvailable() && (
            <TextLink
              className="entity-sidebar__revert btn-link"
              data-test-id="discard-changed-button"
              onClick={() => revert.execute()}>
              Discard changes
            </TextLink>
          )}
        </div>
      </div>
    );
  }
}

StatusWidget.propTypes = {
  status: PropTypes.string.isRequired,
  isSaving: PropTypes.bool.isRequired,
  updatedAt: PropTypes.string,
  isScheduled: PropTypes.bool,
  revert: CommandPropType,
  primary: CommandPropType,
  secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired,
  onScheduledPublishClick: PropTypes.func.isRequired,
  isScheduledPublishDisabled: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  publicationBlockedReason: PropTypes.string,
  entity: PropTypes.object,
  isStatusSwitch: PropTypes.bool
};

StatusWidget.defaultProps = {
  isStatusSwitch: false
};

export default StatusWidget;
