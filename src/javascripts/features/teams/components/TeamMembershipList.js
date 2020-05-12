import React from 'react';
import PropTypes from 'prop-types';

export const TeamMembershipList = ({ items }) => <div>Members List {items.length}</div>;

TeamMembershipList.propTypes = {
  items: PropTypes.array.isRequired,
};
