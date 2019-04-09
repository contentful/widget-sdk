import React from 'react';

import { Button } from '@contentful/forma-36-react-components';
import ScheduleDialog from './ScheduleDialog/index.es6';

export default class NewSchedule extends React.Component {
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
          onClick={() => {
            this.setState({
              isDialogShown: true
            });
          }}>
          Schedule Publication
        </Button>
        {this.state.isDialogShown && (
          <ScheduleDialog
            onCreate={_newSchedule => {
              this.setState({
                isDialogShown: false
              });
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
