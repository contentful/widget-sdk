import React from 'react';
import PropTypes from 'prop-types';

export const name = 'react/button-component';

angular.module('contentful').factory(name, [
  'require',
  function() {
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

    return Button;
  }
]);
