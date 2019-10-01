import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import moment from 'moment';

import {
  Tag,
  Card,
  Icon,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { scheduleStyles as styles } from './styles.es6';
import CancellationModal from './CancellationModal.es6';
import JobAction from 'app/jobs/JobAction.es6';

const FormattedTime = ({ time, size }) =>
  moment
    .utc(time)
    .local()
    .format(size === 'default' ? 'ddd, MMM Do, YYYY - h:mm A' : 'MMM Do, YYYY - h:mm A');

FormattedTime.propTypes = {
  time: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['default', 'small'])
};

FormattedTime.defaultProps = {
  size: 'default'
};

const tagTypeForAction = {
  [JobAction.Publish]: 'positive',
  [JobAction.Unpublish]: 'secondary'
};

class Job extends Component {
  state = {
    isDropdownOpen: false,
    isCancellationDialogOpen: false
  };

  toggleCancelDialog = () => {
    this.setState({
      isCancellationDialogOpen: !this.state.isCancellationDialogOpen,
      isDropdownOpen: false
    });
  };

  render() {
    const { scheduledAt, action, id, onCancel, isReadOnly, size } = this.props;
    return (
      <Card className={cn(styles.schedule, size === 'small' ? styles.scheduleSmall : '')}>
        <div
          className={cn(styles.scheduleHeader, size === 'small' ? styles.scheduleHeaderSmall : '')}>
          <Icon icon="Clock" color="secondary" className={styles.scheduleIcon} />
          <Tag
            className={cn(styles.actionType)}
            tagType={tagTypeForAction[action]}
            testId="scheduled-item">
            {action}
          </Tag>
          {!isReadOnly && (
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
                <DropdownList>
                  <DropdownListItem testId="cancel-job" onClick={this.toggleCancelDialog}>
                    Cancel Schedule
                  </DropdownListItem>
                </DropdownList>
              </Dropdown>

              <CancellationModal
                isShown={this.state.isCancellationDialogOpen}
                onClose={this.toggleCancelDialog}
                onConfirm={() => {
                  this.toggleCancelDialog();
                  onCancel(id);
                }}>
                This entry is scheduled to {action} on <FormattedTime time={scheduledAt} />. <br />
                Are you sure you want to cancel?
              </CancellationModal>
            </>
          )}
        </div>
        <span className={cn(styles.date, size === 'small' ? styles.dateSmall : '')}>
          <FormattedTime time={scheduledAt} size={size} />
        </span>
      </Card>
    );
  }
}

export const propTypes = {
  scheduledAt: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'cancelled', 'success', 'error']),
  id: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  size: PropTypes.oneOf(['default', 'small']).isRequired
};
Job.propTypes = propTypes;

export default Job;
