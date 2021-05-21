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
    const {
      scheduledFor: { datetime },
    } = this.props.job;

    return (
      <Note className={styles.note} noteType="negative" testId="failed-job-note">
        {this.props.failedScheduleNote(datetime)}
      </Note>
    );
  }
}

export default FailedScheduleNote;
