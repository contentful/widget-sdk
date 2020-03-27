import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note } from '@contentful/forma-36-react-components';
import { DateTime } from 'app/ScheduledActions/FormattedDateAndTime';

const styles = {
  form: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
};

export class FailedScheduleNote extends Component {
  static propTypes = {
    job: PropTypes.object,
  };

  render() {
    const scheduledAt = this.props.job.scheduledFor.datetime;

    return (
      <Note className={styles.note} noteType="negative" testId="failed-job-note">
        Due to validation errors this entry failed to {this.props.job.action} on{' '}
        <DateTime date={scheduledAt} />. Please check individual fields and try your action again.
        again.
      </Note>
    );
  }
}

export default FailedScheduleNote;
