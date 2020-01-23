import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note } from '@contentful/forma-36-react-components';

const styles = {
  form: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  })
};

export class FailedScheduleNote extends Component {
  static propTypes = {
    job: PropTypes.object
  };

  render() {
    return (
      <Note className={styles.note} noteType="negative" testId="failed-job-note">
        Due to validation errors this entry failed to publish on:{' '}
        {moment(this.props.job.scheduledFor.datetime).format('ddd, MMM Do, YYYY - hh:mm A')}. Please
        check individual fields and attempt to publish again.
      </Note>
    );
  }
}

export default FailedScheduleNote;
