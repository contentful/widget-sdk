import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const moduleName = 'react/button-component';

angular.module('contentful')
.factory(moduleName, ['require', function () {
  const Button = createReactClass({
    propTypes: {
      children: PropTypes.node,
      className: PropTypes.string
    },
    render () {
      const { children, className, ...props } = this.props;
      return (
        <div className={`button btn-action ${className || ''}`} {...props}>
          {children}
        </div>
      );
    }
  });

  return Button;
}]);

export const name = moduleName;
