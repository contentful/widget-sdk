import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@contentful/forma-36-react-components';
import ScheduleDialog from './ScheduleDialog/index.es6';

export default class NewSchedule extends React.Component {
  static propTypes = {
    onCreate: PropTypes.func.isRequired
  };
  state = {
    isDialogShown: false
  };
  render() {
    return (
      <React.Fragment>
        <Button
          icon="Clock"
          buttonType="muted"
          isFullWidth
          testId="schedule-publication"
          onClick={() => {
            this.setState({
              isDialogShown: true
            });
          }}>
          Schedule Publication
        </Button>
        {this.state.isDialogShown && (
          <ScheduleDialog
            onCreate={newSchedule => {
              this.setState({
                isDialogShown: false
              });
              this.props.onCreate(newSchedule);
            }}
            onCancel={() => {
              this.setState({
                isDialogShown: false
              });
            }}
          />
        )}
      </React.Fragment>
    );
  }
}
