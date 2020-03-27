import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

export default class TaskDeleteDialog extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  render() {
    const { isShown, onConfirm, onCancel } = this.props;

    return (
      <ModalConfirm
        title="Are you sure"
        confirmLabel="Yes, delete task"
        intent="negative"
        isShown={isShown}
        onConfirm={onConfirm}
        onCancel={onCancel}>
        <Paragraph>Are you sure you want to delete this task?</Paragraph>
      </ModalConfirm>
    );
  }
}
