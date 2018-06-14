import React from 'react';
import PropTypes from 'prop-types';

export const name = 'react/form-component';

angular.module('contentful')
.factory(name, [function () {
  class Form extends React.Component {
    onSubmit (e) {
      const { onSubmit } = this.props;
      e.preventDefault();
      return onSubmit && onSubmit(e);
    }
    render () {
      const { className = '', children } = this.props;
      return (
        <form className={className} onSubmit={this.onSubmit}>
          {children}
        </form>
      );
    }
  }

  Form.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    onSubmit: PropTypes.func
  };

  return Form;
}]);
