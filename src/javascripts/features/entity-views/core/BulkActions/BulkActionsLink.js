import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';

export const BulkActionLink = ({ label, visible, onClick, ...props }) => {
  if (!visible) return null;
  const lowerLabel = label.toLowerCase();
  return (
    <TextLink {...props} aria-label={label} testId={lowerLabel} onClick={() => onClick(lowerLabel)}>
      {label}
    </TextLink>
  );
};

BulkActionLink.propTypes = {
  onClick: PropTypes.func.isRequired,
  visible: PropTypes.bool,
  label: PropTypes.string.isRequired,
};
