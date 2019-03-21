import React from 'react';
import { Spinner } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const Placeholder = ({ loading, title, text, button }) => (
  <div className="empty-placeholder">
    {loading ? <Spinner size="large" className="empty-placeholder__spinner" /> : null}
    <h2>{title}</h2>
    <div>{text}</div>
    {button && button}
  </div>
);

Placeholder.propTypes = {
  loading: PropTypes.bool,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  button: PropTypes.element
};

Placeholder.defaultProps = {
  loading: false
};

export default Placeholder;
