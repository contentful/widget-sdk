import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Button } from '@contentful/forma-36-react-components';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import ScheduledActionsTimeline from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/index.js';
import { styles } from './styles';

const ReleaseWorkBenchSideBar = ({
  isJobsLoading,
  error,
  hasScheduledActions,
  pendingJobs,
  handlePublication,
  handleValidation,
  handleScheduleCancel,
  setShowScheduleActionDialog,
  isMasterEnvironment,
}) => {
  const {
    state: {
      entities: { entries, assets },
    },
  } = useContext(ReleasesContext);
  return (
    <Workbench.Sidebar className={styles.sidebar} position="right" testId="cf-ui-workbench-sidebar">
      {!isJobsLoading && !error && (
        <>
          {/* {shouldShowErrorNote(lastJob, entity) && <FailedScheduleNote job={lastJob} />} */}
          {hasScheduledActions && (
            <ScheduledActionsTimeline
              isMasterEnvironment={isMasterEnvironment}
              jobs={pendingJobs}
              onCancel={handleScheduleCancel}
              isReadOnly={false}
            />
          )}
        </>
      )}
      <div className={styles.buttons}>
        <Button
          testId="publish-release"
          buttonType="positive"
          className=""
          isFullWidth
          disabled={!entries.length && !assets.length}
          onClick={handlePublication}>
          Publish now
        </Button>
        <Button
          testId="validate-release"
          buttonType="muted"
          className={styles.buttons}
          isFullWidth
          disabled={!entries.length && !assets.length}
          onClick={handleValidation}>
          Validate
        </Button>
        <Button
          testId="schedule-release"
          buttonType="muted"
          className={styles.buttons}
          isFullWidth
          disabled={!entries.length && !assets.length}
          onClick={() => setShowScheduleActionDialog(true)}>
          Schedule
        </Button>
      </div>
    </Workbench.Sidebar>
  );
};

ReleaseWorkBenchSideBar.propTypes = {
  isJobsLoading: PropTypes.bool.isRequired,
  error: PropTypes.object.isRequired,
  hasScheduledActions: PropTypes.bool.isRequired,
  pendingJobs: PropTypes.array.isRequired,
  handlePublication: PropTypes.func.isRequired,
  handleValidation: PropTypes.func.isRequired,
  handleScheduleCancel: PropTypes.func.isRequired,
  setShowScheduleActionDialog: PropTypes.func.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
};

export default ReleaseWorkBenchSideBar;
