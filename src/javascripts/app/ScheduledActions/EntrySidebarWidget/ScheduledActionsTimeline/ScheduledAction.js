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
import ScheduledActionAction from 'app/ScheduledActions/ScheduledActionAction';
import UserFetcher from 'components/shared/UserFetcher';
import UserDisplayName from 'app/UserProfile/components/UserDisplayName';

const tagTypeForAction = {
  [ScheduledActionAction.Publish]: 'positive',
  [ScheduledActionAction.Unpublish]: 'secondary',
};

export function ScheduledByDropdownList({ job, border }) {
  const userId = _.get(job, 'sys.createdBy.sys.id');

  if (!userId) {
    return null;
  }

  return (
    <UserFetcher userId={userId}>
      {({ isLoading, isError, data: user }) => {
        if (isError) {
          return null;
        }

        return (
          <DropdownList border={border}>
            <DropdownListItem className={styles.scheduleDropdownScheduledBy} testId="scheduled-by">
              {isLoading ? (
                <SkeletonContainer>
                  <SkeletonDisplayText numberOfLines={1} />
                </SkeletonContainer>
              ) : (
                <span>
                  Scheduled by <UserDisplayName user={user} />
                </span>
              )}
            </DropdownListItem>
          </DropdownList>
        );
      }}
    </UserFetcher>
  );
}

ScheduledByDropdownList.propTypes = {
  job: PropTypes.object,
  border: PropTypes.string,
};

class Job extends Component {
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
    const { size, isReadOnly, job, onCancel } = this.props;
    const {
      sys: { id },
      action,
      scheduledFor: { datetime: scheduledAt },
    } = job;

    // Do not render the dropdown for the read only small view (e.g. in the Schedule Action dialog)
    if (isReadOnly && size === 'small') {
      return null;
    }

    const showDropdown = !isReadOnly || job.sys.createdBy;

    if (!showDropdown) {
      return null;
    }

    return (
      <>
        <Dropdown
          isOpen={this.state.isDropdownOpen}
          onClose={() => this.setState({ isDropdownOpen: false })}
          toggleElement={
            <Button
              className={styles.scheduleDropdownToggle}
              buttonType="naked"
              data-test-id="cancel-job-ddl"
              icon="MoreHorizontal"
              onClick={() => this.setState({ isDropdownOpen: !this.state.isDropdownOpen })}
            />
          }>
          {!isReadOnly && (
            <DropdownList>
              <DropdownListItem testId="cancel-job" onClick={this.toggleCancelDialog}>
                Cancel Schedule
              </DropdownListItem>
            </DropdownList>
          )}
          <ScheduledByDropdownList job={job} border="top" />
        </Dropdown>

        {!isReadOnly && (
          <CancellationModal
            isShown={this.state.isCancellationDialogOpen}
            onClose={this.toggleCancelDialog}
            onConfirm={() => {
              this.toggleCancelDialog();
              onCancel(id);
            }}>
            This entry is scheduled to {action} on <DateTime date={scheduledAt} />. <br />
            Are you sure you want to cancel?
          </CancellationModal>
        )}
      </>
    );
  };

  render() {
    const { job, size } = this.props;
    const {
      action,
      scheduledFor: { datetime: scheduledAt },
    } = job;

    return (
      <Card className={cn(styles.schedule, size === 'small' ? styles.scheduleSmall : '')}>
        <div
          className={cn(styles.scheduleHeader, size === 'small' ? styles.scheduleHeaderSmall : '')}>
          <Icon icon="Clock" color="secondary" className={styles.scheduleIcon} />
          <Tag
            className={styles.actionType}
            tagType={tagTypeForAction[action]}
            testId="scheduled-item">
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
  job: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  size: PropTypes.oneOf(['default', 'small']).isRequired,
};
Job.propTypes = propTypes;

export default Job;
