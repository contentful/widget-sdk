import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';
import { Workbench, Button, Subheading } from '@contentful/forma-36-react-components';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import { DateTime } from 'app/ScheduledActions/FormattedDateAndTime';
import FailedScheduleNote from 'app/ScheduledActions/EntrySidebarWidget/FailedScheduleNote/index';
import ScheduledActionsTimeline from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/index';
import { styles } from './styles';

const ReleaseWorkBenchSideBar = ({
  isJobsLoading,
  error,
  lastJob,
  pendingJobs,
  handlePublication,
  handleValidation,
  handleScheduleCancel,
  handleShowingScheduleActionDialog,
  isMasterEnvironment,
}) => {
  const {
    state: {
      entities: { entries, assets },
    },
  } = useContext(ReleasesContext);
  const hasScheduledActions = pendingJobs.length > 0;
  const shouldShowErrorNote = () => {
    if (!lastJob) {
      return false;
    }

    const isFailed = lastJob.sys.status === 'failed';
    return isFailed;
  };

  const failedScheduleNote = (scheduledAt) => {
    return (
      <>
        Due to validation errors this release failed to publish on <DateTime date={scheduledAt} />.
      </>
    );
  };

  return (
    <Workbench.Sidebar className={styles.sidebar} position="right" testId="cf-ui-workbench-sidebar">
      {!isJobsLoading && !error && (
        <>
          {shouldShowErrorNote() && (
            <FailedScheduleNote job={lastJob} failedScheduleNote={failedScheduleNote} />
          )}
          {hasScheduledActions && (
            <ScheduledActionsTimeline
              isMasterEnvironment={isMasterEnvironment}
              jobs={pendingJobs}
              onCancel={handleScheduleCancel}
              isReadOnly={false}
              showAllScheduleLink={false}
              linkType="release"
            />
          )}
        </>
      )}
      <div>
        <header className="entity-sidebar__header">
          <Subheading
            className={cx('entity-sidebar__heading', {
              [styles.sideBarHeader]: hasScheduledActions,
            })}>
            Actions
          </Subheading>
        </header>
        <div>These actions will apply to all the contents in this release</div>
        <Button
          testId="publish-release"
          buttonType="positive"
          className={styles.buttons}
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
          onClick={handleShowingScheduleActionDialog}>
          Schedule
        </Button>
      </div>
    </Workbench.Sidebar>
  );
};

ReleaseWorkBenchSideBar.propTypes = {
  isJobsLoading: PropTypes.bool,
  error: PropTypes.object,
  lastJob: PropTypes.object,
  pendingJobs: PropTypes.array.isRequired,
  handlePublication: PropTypes.func.isRequired,
  handleValidation: PropTypes.func.isRequired,
  handleScheduleCancel: PropTypes.func.isRequired,
  handleShowingScheduleActionDialog: PropTypes.func.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
};

export default ReleaseWorkBenchSideBar;
