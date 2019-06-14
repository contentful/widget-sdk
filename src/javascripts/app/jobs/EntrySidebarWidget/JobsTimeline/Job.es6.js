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

const FormattedTime = time =>
  moment
    .utc(time)
    .local()
    .format('ddd, MMM Do, YYYY - hh:mm A');

const tagTypeForAction = {
  publish: 'positive'
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
    const { scheduledAt, action, job, onCancel } = this.props;
    return (
      <Card className={styles.schedule}>
        <div className={styles.scheduleHeader}>
          <Icon icon="Clock" color="secondary" className={styles.scheduleIcon} />
          <Tag
            className={cn(styles.actionType)}
            tagType={tagTypeForAction[action]}
            testId="scheduled-item">
            {action}
          </Tag>
          <Dropdown
            isOpen={this.state.isDropdownOpen}
            onClose={() => this.setState({ isDropdownOpen: false })}
            toggleElement={
              <Button
                className={styles.scheduleDropdownToggle}
                buttonType="naked"
                testId="cancel-job"
                icon="MoreHorizontal"
                onClick={() => this.setState({ isDropdownOpen: !this.state.isDropdownOpen })}
              />
            }>
            <DropdownList>
              <DropdownListItem onClick={this.toggleCancelDialog}>Cancel Schedule</DropdownListItem>
            </DropdownList>
          </Dropdown>
        </div>
        <span className={styles.date}>{FormattedTime(scheduledAt)}</span>
        <CancellationModal
          isShown={this.state.isCancellationDialogOpen}
          onClose={this.toggleCancelDialog}
          onConfirm={() => onCancel(job.sys.id)}
        />
      </Card>
    );
  }
}

export const propTypes = {
  scheduledAt: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'cancelled', 'success', 'error']),
  job: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired
};
Job.propTypes = propTypes;

export default Job;
