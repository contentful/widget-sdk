import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note } from '@contentful/forma-36-react-components';

const styles = {
  form: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
};

export class FailedScheduleNote extends Component {
  static propTypes = {
    job: PropTypes.object,
    failedScheduleNote: PropTypes.func,
  };

  render() {
    const scheduledAt = this.props.job.scheduledFor.datetime;

    return (
      <Note className={styles.note} noteType="negative" testId="failed-job-note">
        {this.props.failedScheduleNote(scheduledAt)}
      </Note>
    );
  }
}

export default FailedScheduleNote;
