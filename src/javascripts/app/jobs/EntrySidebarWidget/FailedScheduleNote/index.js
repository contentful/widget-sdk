import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Note } from '@contentful/forma-36-react-components';

export class FailedScheduleNote extends Component {
  static propTypes = {
    job: PropTypes.object
  };

  render() {
    return (
      <Note
        className="f36-margin-bottom--m f36-margin-top--m"
        noteType="negative"
        testId="failed-job-note">
        Due to validation errors this entry failed to publish on:{' '}
        {moment(this.props.job.scheduledAt).format('ddd, MMM Do, YYYY - hh:mm A')}. Please check
        individual fields and attempt to publish again.
      </Note>
    );
  }
}

export default FailedScheduleNote;
