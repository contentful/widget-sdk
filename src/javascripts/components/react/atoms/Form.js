import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';

export const name = 'react/form-component';

angular.module('contentful').factory(name, [
  function() {
    const Form = ({ className, children, onSubmit }) => {
      return (
        <form className={className} onSubmit={onSubmit}>
          {children}
        </form>
      );
    };

    Form.defaultProps = {
      className: '',
      onSubmit: noop
    };

    Form.propTypes = {
      className: PropTypes.string,
      children: PropTypes.node,
      onSubmit: PropTypes.func
    };

    return Form;
  }
]);
