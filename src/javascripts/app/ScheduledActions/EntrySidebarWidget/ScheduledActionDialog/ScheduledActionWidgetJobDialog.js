import React, { useCallback, useState } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Notification } from '@contentful/forma-36-react-components';

import ScheduledAction from 'app/ScheduledActions/ScheduledActionAction';
import JobDialog from './JobDialog';
import { formatScheduledAtDate } from './utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';

const ENTITY_TITLE_TRUNCATED_LENGTH = 60;

function ScheduledActionWidgetJobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  entity,
  validator,
  entityTitle,
  pendingJobs,
  isMasterEnvironment,
}) {
  const [validationError, setValidationError] = useState('');

  const client = useCurrentSpaceAPIClient();

  const validateForm = useCallback(
    (onFormValid, { date, time, timezone }) => {
      if (
        pendingJobs &&
        pendingJobs.length > 0 &&
        pendingJobs.find(
          (job) =>
            job.scheduledFor.datetime ===
            moment(formatScheduledAtDate({ date, time, timezone })).toISOString()
        )
      ) {
        setValidationError(
          'There is already an action scheduled for the selected time, please review the current schedule.'
        );
        return;
      } else {
        setValidationError(null);
      }

      if (moment(formatScheduledAtDate({ date, time, timezone })).isAfter(moment.now())) {
        setValidationError(null);
        if (onFormValid) {
          onFormValid();
        }
      } else {
        setValidationError("The selected time can't be in the past");
      }
    },
    [pendingJobs]
  );

  function handleSubmit({ action, date, time, timezone }) {
    const truncatedTitle =
      entityTitle.length > ENTITY_TITLE_TRUNCATED_LENGTH
        ? `${entityTitle.slice(0, ENTITY_TITLE_TRUNCATED_LENGTH)}...`
        : entityTitle;
    validateForm(
      async () => {
        if (action === ScheduledAction.Publish) {
          try {
            if (entity.sys.type === 'Entry') {
              await client.validateEntry(entity);
            } else {
              const isValid = validator.run();
              if (!isValid) {
                Notification.error(
                  `Error scheduling ${truncatedTitle}: Validation failed. Please check the individual fields for errors.`
                );
                onCancel();
                return;
              }
            }
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
      },
      { date, time, timezone }
    );
  }

  return (
    <JobDialog
      handleSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      pendingJobs={pendingJobs}
      showUnpublish={true}
      isMasterEnvironment={isMasterEnvironment}
      linkType={entity.sys.type}
      validationError={validationError}
    />
  );
}

ScheduledActionWidgetJobDialog.propTypes = {
  entity: PropTypes.object.isRequired,
  validator: PropTypes.shape({
    run: PropTypes.func,
    setApiResponseErrors: PropTypes.func,
  }).isRequired,
  entityTitle: PropTypes.string.isRequired,
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  isMasterEnvironment: PropTypes.bool,
};

export default ScheduledActionWidgetJobDialog;
