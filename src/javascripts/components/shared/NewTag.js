import { Tag } from '@contentful/forma-36-react-components';
import React from 'react';
import PropTypes from 'prop-types';

const NewTag = ({ label, key, className }) => {
  return (
    <Tag key={key} tagType="primary-filled" className={className}>
      {label || 'new'}
    </Tag>
  );
};

NewTag.propTypes = {
  label: PropTypes.string,
  key: PropTypes.string,
  className: PropTypes.string,
};

export { NewTag };
