import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@contentful/forma-36-react-components';

// TODO: Share this code with <PublicationWidget />

export default function RestrictedAction({ actionName }) {
  return (
    <React.Fragment>
      <Icon
        icon="Lock"
        color="muted"
        className="action-restricted__icon"
        testId="action-restriction-icon"
      />
      {actionName}
    </React.Fragment>
  );
}

RestrictedAction.propTypes = {
  actionName: PropTypes.string.isRequired
};
