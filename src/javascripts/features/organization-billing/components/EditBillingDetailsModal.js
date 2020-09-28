import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Modal, Notification } from '@contentful/forma-36-react-components';
import { BillingDetailsForm } from './BillingDetailsForm';
import { BillingDetailsPropType } from '../propTypes';
import { updateBillingDetails } from '../services/BillingDetailsService';

const classes = {
  modal: css({
    maxHeight: 'none',
  }),
};

const handleSubmit = (organizationId, onConfirm) => async (data) => {
  try {
    await updateBillingDetails(organizationId, data);
  } catch (e) {
    Notification.error(
      'Something went wrong. Try again or contact us if you continue to see this.'
    );

    return {};
  }

  Notification.success('Billing details successfully updated.');
  onConfirm(data);
};

export function EditBillingDetailsModal({
  organizationId,
  billingDetails,
  isShown,
  onCancel,
  onConfirm,
}) {
  const onSubmit = useCallback(handleSubmit(organizationId, onConfirm), [
    organizationId,
    onConfirm,
  ]);

  return (
    <Modal
      testId="edit-billing-details-modal"
      title="Edit billing details"
      className={classes.modal}
      position="top"
      topOffset="20px"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={isShown}
      onClose={onCancel}
      size="large">
      <BillingDetailsForm billingDetails={billingDetails} onCancel={onCancel} onSubmit={onSubmit} />
    </Modal>
  );
}

EditBillingDetailsModal.propTypes = {
  organizationId: PropTypes.string.isRequired,
  billingDetails: BillingDetailsPropType.isRequired,
  isShown: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
