import React from 'react';
import PropTypes from 'prop-types';
import { Notification } from '@contentful/forma-36-react-components';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';

import ScheduledAction from 'app/ScheduledActions/ScheduledActionAction';
import JobDialog from './JobDialog';
import { formatScheduledAtDate } from './utils';

function ScheduledActionWidgetJobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  entity,
  validator,
  entryTitle,
  spaceId,
  environmentId,
  pendingJobs,
  isMasterEnvironment,
}) {
  const endpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);
  const client = new APIClient(endpoint);

  function handleSubmit({ validateForm, action, date, time, timezone }) {
    const truncationLength = 60;
    const truncatedTitle =
      entryTitle.length > truncationLength
        ? `${entryTitle.slice(0, truncationLength)}...`
        : entryTitle;
    validateForm(async () => {
      if (action === ScheduledAction.Publish) {
        try {
          await client.validateEntry(entity);
        } catch (e) {
          validator.setApiResponseErrors(e);
          Notification.error(
            `Error scheduling ${truncatedTitle}: Validation failed. Please check the individual fields for errors.`
          );
          return;
        }
      }
      onCreate(
        {
          scheduledAt: formatScheduledAtDate({ date, time, timezone }),
          action,
        },
        timezone
      );
    });
  }

  return (
    <JobDialog
      handleSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      pendingJobs={pendingJobs}
      isMasterEnvironment={isMasterEnvironment}
    />
  );
}

ScheduledActionWidgetJobDialog.propTypes = {
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  validator: PropTypes.shape({
    run: PropTypes.func,
    setApiResponseErrors: PropTypes.func,
  }).isRequired,
  entryTitle: PropTypes.string.isRequired,
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  isMasterEnvironment: PropTypes.bool,
};

export default ScheduledActionWidgetJobDialog;
