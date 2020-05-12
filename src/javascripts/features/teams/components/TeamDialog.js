/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';

export class TeamDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  render() {
    const { onClose, isShown } = this.props;
    return (
      <Modal isShown={isShown} onClose={onClose}>
        <Modal.Header title={'TeamDialog'} onClose={onClose} />
      </Modal>
    );
  }
}
