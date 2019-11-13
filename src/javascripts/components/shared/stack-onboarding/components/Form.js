import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';

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

export default Form;
