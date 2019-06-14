import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Note } from '@contentful/forma-36-react-components';

export class FailedScheduleNote extends Component {
  static propTypes = {
    recentJob: PropTypes.object
  };

  renderFailureText = () =>
    `Due to validation errors this entry failed to publish on: ${moment(
      this.props.recentJob.scheduledAt
    ).format(
      'ddd, MMM Do, YYYY - hh:mm A'
    )}. Please check individual fields and attempt to publish again.`;

  render() {
    return (
      <Note className="f36-margin-bottom--m" noteType="negative">
        {this.renderFailureText()}
      </Note>
    );
  }
}

export default FailedScheduleNote;
