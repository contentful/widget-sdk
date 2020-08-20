import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import _ from 'lodash';

import {
  Tag,
  Card,
  Icon,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  SkeletonDisplayText,
  SkeletonContainer,
} from '@contentful/forma-36-react-components';
import { scheduleStyles as styles } from './styles';
import CancellationModal from './CancellationModal';
import { DateTime } from 'app/ScheduledActions/FormattedDateAndTime';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import ScheduledActionAction from 'app/ScheduledActions/ScheduledActionAction';
import { ScheduledActionsStateLink } from 'app/ScheduledActions/ScheduledActionsPageLink';

const tagTypeForAction = {
  [ScheduledActionAction.Publish]: 'positive',
  [ScheduledActionAction.Unpublish]: 'secondary',
};

export function ScheduledByDropdownList({ scheduledAction, border }) {
  const userId = _.get(scheduledAction, 'sys.createdBy.sys.id');

  if (!userId) {
    return null;
  }

  return (
    <DropdownList border={border}>
      <DropdownListItem className={styles.scheduleDropdownScheduledBy} testId="scheduled-by">
        <span>
          <ActionPerformerName
            link={_.get(scheduledAction, 'sys.createdBy')}
            formatName={(name) => `Scheduled by ${name === 'Me' ? name.toLowerCase() : name}`}
            loadingComponent={
              <SkeletonContainer>
                <SkeletonDisplayText numberOfLines={1} />
              </SkeletonContainer>
            }
          />
        </span>
      </DropdownListItem>
    </DropdownList>
  );
}

ScheduledByDropdownList.propTypes = {
  scheduledAction: PropTypes.object,
  border: PropTypes.string,
};

class ScheduledAction extends Component {
  state = {
    isDropdownOpen: false,
    isCancellationDialogOpen: false,
  };

  toggleCancelDialog = () => {
    this.setState({
      isCancellationDialogOpen: !this.state.isCancellationDialogOpen,
      isDropdownOpen: false,
    });
  };

  renderDropdown = () => {
    const {
      size,
      isReadOnly,
      scheduledAction,
      onCancel,
      isMasterEnvironment,
      showLinkToSchedulesView,
    } = this.props;
    const {
      sys: { id },
      action,
      scheduledFor: { datetime: scheduledAt },
    } = scheduledAction;

    // Do not render the dropdown for the read only small view (e.g. in the Schedule Action dialog)
    if (isReadOnly && size === 'small') {
      return null;
    }

    const showDropdown = !isReadOnly || scheduledAction.sys.createdBy;

    if (!showDropdown) {
      return null;
    }

    const shouldHaveDropdown = !isReadOnly || (isMasterEnvironment && showLinkToSchedulesView);

    return (
      <>
        <Dropdown
          isOpen={this.state.isDropdownOpen}
          onClose={() => this.setState({ isDropdownOpen: false })}
          toggleElement={
            <Button
              className={styles.scheduleDropdownToggle}
              buttonType="naked"
              testId="cancel-scheduled-action-ddl"
              icon="MoreHorizontal"
              onClick={() => this.setState({ isDropdownOpen: !this.state.isDropdownOpen })}
            />
          }>
          {shouldHaveDropdown && (
            <DropdownList>
              {!isReadOnly && (
                <DropdownListItem
                  testId="cancel-scheduled-action"
                  onClick={this.toggleCancelDialog}>
                  Cancel schedule
                </DropdownListItem>
              )}
              {isMasterEnvironment && showLinkToSchedulesView && (
                <ScheduledActionsStateLink isMasterEnvironment={isMasterEnvironment}>
                  {({ getHref, onClick }) => (
                    <DropdownListItem
                      testId="view-all-schedules"
                      href={getHref()}
                      onClick={onClick}>
                      View schedule
                    </DropdownListItem>
                  )}
                </ScheduledActionsStateLink>
              )}
            </DropdownList>
          )}
          <ScheduledByDropdownList scheduledAction={scheduledAction} border="top" />
        </Dropdown>

        {!isReadOnly && (
          <CancellationModal
            isShown={this.state.isCancellationDialogOpen}
            onClose={this.toggleCancelDialog}
            onConfirm={() => {
              this.toggleCancelDialog();
              onCancel(id);
            }}>
            This {this.props.linkType} is scheduled to {action} on <DateTime date={scheduledAt} />.{' '}
            <br />
            Are you sure you want to cancel?
          </CancellationModal>
        )}
      </>
    );
  };

  render() {
    const { scheduledAction, size } = this.props;
    const {
      action,
      scheduledFor: { datetime: scheduledAt },
    } = scheduledAction;

    return (
      <Card
        testId="scheduled-action-card"
        className={cn(styles.schedule, size === 'small' ? styles.scheduleSmall : '')}>
        <div
          className={cn(styles.scheduleHeader, size === 'small' ? styles.scheduleHeaderSmall : '')}>
          <Icon icon="Clock" color="secondary" className={styles.scheduleIcon} />
          <Tag
            className={styles.actionType}
            tagType={tagTypeForAction[action]}
            testId="scheduled-action">
            {action}
          </Tag>
          {this.renderDropdown()}
        </div>
        <DateTime
          date={scheduledAt}
          className={cn(styles.date, size === 'small' ? styles.dateSmall : '')}
          short={size === 'small'}
        />
      </Card>
    );
  }
}

export const propTypes = {
  scheduledAction: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  size: PropTypes.oneOf(['default', 'small']).isRequired,
  linkType: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool,
  showLinkToSchedulesView: PropTypes.bool,
};
ScheduledAction.propTypes = propTypes;

export default ScheduledAction;
