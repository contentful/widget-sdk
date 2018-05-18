import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'react/form-component';

angular.module('contentful')
.factory(moduleName, [function () {
  const Form = createReactClass({
    propTypes: {
      className: PropTypes.string,
      children: PropTypes.node,
      onSubmit: PropTypes.func
    },
    onSubmit (e) {
      const { onSubmit } = this.props;
      e.preventDefault();
      return onSubmit && onSubmit(e);
    },
    render () {
      const { className, children } = this.props;
      return (
        <form className={className || ''} onSubmit={this.onSubmit}>
          {children}
        </form>
      );
    }
  });

  return Form;
}]);

export const name = moduleName;
