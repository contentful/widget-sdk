import React from 'react';
import PropTypes from 'prop-types';

export const TeamSpaceMembershipList = ({ items }) => <div>Space List {items.length}</div>;

TeamSpaceMembershipList.propTypes = {
  items: PropTypes.array.isRequired,
};
