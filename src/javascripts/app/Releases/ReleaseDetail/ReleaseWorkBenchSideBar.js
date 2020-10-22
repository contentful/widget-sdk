import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';
import { Workbench, Button, Subheading } from '@contentful/forma-36-react-components';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import { DateTime } from 'app/ScheduledActions/FormattedDateAndTime';
import FailedScheduleNote from 'app/ScheduledActions/EntrySidebarWidget/FailedScheduleNote/index';
import ScheduledActionsTimeline from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/index';
import { styles } from './styles';
import { getReleaseAction } from '../releasesService';

const ReleaseWorkBenchSideBar = ({
  isJobsLoading,
  error,
  lastJob,
  pendingJobs,
  handlePublication,
  handleValidation,
  handleScheduleCancel,
  setShowScheduleActionDialog,
  isMasterEnvironment,
  release,
}) => {
  const [shouldShowErrorNote, setShouldShowErrorNote] = useState(false);
  const {
    state: {
      entities: { entries, assets },
    },
  } = useContext(ReleasesContext);

  const hasScheduledActions = pendingJobs.length > 0;

  useEffect(() => {
    const shouldShowErrorNote = async () => {
      if (!lastJob) {
        setShouldShowErrorNote(false);
        return;
      }

      const { id: releaseId, lastAction } = release.sys;
      const {
        sys: { status },
        action,
      } = await getReleaseAction(releaseId, lastAction?.sys.id);

      if (status === 'succeeded' && action === 'publish') {
        setShouldShowErrorNote(false);
        return;
      }

      const isFailed = lastJob.sys.status === 'failed';
      setShouldShowErrorNote(isFailed);
    };

    shouldShowErrorNote();
  }, [release, lastJob]);

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
          {shouldShowErrorNote && (
            <FailedScheduleNote job={lastJob} failedScheduleNote={failedScheduleNote} />
          )}
          {hasScheduledActions && (
            <ScheduledActionsTimeline
              isMasterEnvironment={isMasterEnvironment}
              jobs={pendingJobs}
              onCancel={handleScheduleCancel}
              isReadOnly={false}
              showAllScheduleLink={false}
              linkType="Release"
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
          testId="schedule-release"
          buttonType="muted"
          className={styles.buttons}
          isFullWidth
          disabled={!entries.length && !assets.length}
          onClick={() => setShowScheduleActionDialog(true)}>
          Schedule
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
  setShowScheduleActionDialog: PropTypes.func.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  release: PropTypes.object,
};

export default ReleaseWorkBenchSideBar;
