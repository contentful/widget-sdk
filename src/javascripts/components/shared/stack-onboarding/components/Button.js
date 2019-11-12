import React from 'react';
import PropTypes from 'prop-types';

class Button extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    disabled: PropTypes.bool
  };

  render() {
    const { children, className, isLoading, disabled, ...props } = this.props;

    const classNames = `
    button btn-action
    ${isLoading ? 'is-loading' : ''}
    ${className || ''}
  `;

    return (
      <button className={classNames} disabled={Boolean(disabled)} {...props}>
        {children}
      </button>
    );
  }
}

export default Button;
