import React from 'react';
import { Spinner } from '@contentful/ui-component-library';
import PropTypes from 'prop-types';

const EmptyPlaceholder = ({ loading }) => (
  <div className="organization-membership-list__placeholder--empty">
    {loading ? <Spinner size="large" extraClassNames="organization-users-page__spinner" /> : null}
    <h2>No users found 🧐</h2>
    <div>Check your spelling or try changing the filters</div>
  </div>
);

EmptyPlaceholder.propTypes = {
  loading: PropTypes.bool
};

export default EmptyPlaceholder;
