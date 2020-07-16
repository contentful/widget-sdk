import React from 'react';
import PropTypes from 'prop-types';
// import ScheduledAction from 'app/ScheduledActions/ScheduledActionAction';
import JobDialog from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/JobDialog';

import { formatScheduledAtDate } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/utils.js';

function ReleaseActionJobDialog({
  onCreate,
  onCancel,
  isSubmitting,
  pendingJobs,
  isMasterEnvironment,
}) {
  function handleSubmit({ validateForm, action, date, time, timezone }) {
    validateForm(async () => {
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

ReleaseActionJobDialog.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array,
  isMasterEnvironment: PropTypes.bool,
};

export default ReleaseActionJobDialog;
