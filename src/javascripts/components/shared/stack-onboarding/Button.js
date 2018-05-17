import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const moduleName = 'react/button-component';

angular.module('contentful')
.factory(moduleName, ['require', function () {
  const Button = createReactClass({
    propTypes: {
      children: PropTypes.node,
      className: PropTypes.string,
      isLoading: PropTypes.bool,
      disabled: PropTypes.bool
    },
    render () {
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
  });

  return Button;
}]);

export const name = moduleName;
