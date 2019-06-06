import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Note } from '@contentful/forma-36-react-components';

export class FailedScheduleNote extends Component {
  static propTypes = {
    recentJob: PropTypes.object,
    prevJob: PropTypes.object
  };

  renderFailureText = () =>
    `Due to validation errors this entry failed to publish on: ${moment(
      this.props.recentJob.scheduledAt
    ).format(
      'ddd, MMM Do, YYYY - hh:mm A'
    )}. Please check individual fields and attempt to publish again.`;

  renderUpdateText = () =>
    `This entry previously failed to publish due to validation errors. It is scheduled to publish again at ${moment(
      this.props.recentJob.scheduledAt
    ).format('ddd, MMM Do, YYYY - hh:mm A')}`;

  renderNoteText = status =>
    status === 'negative' ? this.renderFailureText() : this.renderUpdateText();

  getNoteStatus = () => {
    const { recentJob, prevJob } = this.props;
    if (recentJob.sys.status === 'failed') {
      return 'negative';
    } else if (prevJob && prevJob.sys.status === 'failed' && recentJob.sys.status === 'pending') {
      return 'warning';
    }
    return null;
  };
  render() {
    const noteStatus = this.getNoteStatus();
    if (!noteStatus) {
      return null;
    }
    return (
      <Note className="f36-margin-bottom--m" noteType={noteStatus}>
        {this.renderNoteText(noteStatus)}
      </Note>
    );
  }
}

export default FailedScheduleNote;
