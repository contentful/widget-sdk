import React, { useCallback, useState } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import JobDialog from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/JobDialog';

import { formatScheduledAtDate } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/utils.js';

function ReleaseActionJobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  pendingJobs,
  isMasterEnvironment,
}) {
  const [validationError, setValidationError] = useState();

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
    validateForm(
      async () => {
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
      isMasterEnvironment={isMasterEnvironment}
      linkType="Release"
      validationError={validationError}
    />
  );
}

ReleaseActionJobDialog.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  isMasterEnvironment: PropTypes.bool,
};

export default ReleaseActionJobDialog;
