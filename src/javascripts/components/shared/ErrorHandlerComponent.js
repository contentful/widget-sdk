import React from 'react';
import * as logger from 'services/logger';
import PropTypes from 'prop-types';
import { Notification } from '@contentful/forma-36-react-components';

export default class ErrorHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
    logger.logError(error, info);
  }

  render() {
    const { notificationMessage, renderOnError } = this.props;
    if (this.state.hasError) {
      Notification.error(notificationMessage);
      return renderOnError;
    }
    return this.props.children;
  }
}

ErrorHandler.propTypes = {
  renderOnError: PropTypes.node,
  notificationMessage: PropTypes.string
};

ErrorHandler.defaultProps = {
  renderOnError: null,
  notificationMessage: 'Something went wrong'
};
