import React, { useState } from 'react';
import PropTypes from 'prop-types';
import JobDialog, {
  validateScheduleForm,
} from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/JobDialog';

import { formatScheduledAtDate } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/utils.js';

function ReleaseActionJobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  pendingJobs,
  isMasterEnvironment,
}) {
  const [validationError, setValidationError] = useState();

  function handleSubmit({ action, date, time, timezone }) {
    const validationErrorMessage = validateScheduleForm(pendingJobs, { date, time, timezone });
    setValidationError(validationErrorMessage);

    if (validationErrorMessage) {
      return;
    }

    onCreate(
      {
        scheduledAt: formatScheduledAtDate({ date, time, timezone }),
        action,
      },
      timezone
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
