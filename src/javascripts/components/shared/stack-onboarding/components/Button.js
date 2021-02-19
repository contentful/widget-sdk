import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

class CustomButton extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    disabled: PropTypes.bool,
  };

  render() {
    const { children, isLoading, disabled, ...props } = this.props;

    return (
      <Button loading={isLoading} disabled={Boolean(disabled)} {...props}>
        {children}
      </Button>
    );
  }
}

export default CustomButton;
