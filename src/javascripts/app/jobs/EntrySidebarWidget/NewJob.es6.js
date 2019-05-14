import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@contentful/forma-36-react-components';
import JobDialog from './JobDialog/index.es6';

export default class NewJob extends React.Component {
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
          <JobDialog
            onCreate={newJob => {
              this.setState({
                isDialogShown: false
              });
              this.props.onCreate(newJob);
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
