import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@contentful/forma-36-react-components';

// TODO: Share this code with <PublicationWidget />

export default function ActionRestrictedNote({ actionName }) {
  return (
    <p className="f36-color--text-light f36-margin-top--xs" data-test-id="action-restriction-note">
      <Icon icon="Lock" color="muted" className="action-restricted__icon" />
      You do not have permission to {actionName.toLowerCase()}.
    </p>
  );
}

ActionRestrictedNote.propTypes = {
  actionName: PropTypes.string.isRequired
};
