import React from 'react';
import * as logger from 'services/logger';
import PropTypes from 'prop-types';

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
    const { renderOnError } = this.props;
    if (this.state.hasError) {
      return renderOnError;
    }
    return this.props.children;
  }
}

ErrorHandler.propTypes = {
  renderOnError: PropTypes.node
};

ErrorHandler.defaultProps = {
  renderOnError: null
};
