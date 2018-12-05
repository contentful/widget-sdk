import React from 'react';
import PropTypes from 'prop-types';

import TeamForm from './TeamForm.es6';
import { Modal } from '@contentful/forma-36-react-components';

export default function TeamFormDialog(props) {
  const { isShown, onClose, orgId, initialTeam } = props;
  return (
    <Modal isShown={isShown} onClose={onClose}>
      {() => <TeamForm onClose={onClose} orgId={orgId} initialTeam={initialTeam} />}
    </Modal>
  );
}

TeamFormDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired,
  initialTeam: PropTypes.object
};
