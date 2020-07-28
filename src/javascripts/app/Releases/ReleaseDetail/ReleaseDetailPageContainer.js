import React, { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Icon, Note, Notification } from '@contentful/forma-36-react-components';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { ReleasesProvider, ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import {
  getReleaseById,
  replaceReleaseById,
  publishRelease,
  validateReleaseAction,
} from '../releasesService';
import { newForLocale } from 'app/entity_editor/entityHelpers';
import * as logger from 'services/logger';
import { useAsyncFn } from 'core/hooks';
import {
  getEntities,
  waitForReleaseAction,
  switchToErroredTab,
  unpublishedEntities,
} from './utils';
import {
  SET_RELEASE_ENTITIES,
  SET_RELEASE_ENTITIES_LOADING,
  SET_RELEASE_VALIDATIONS,
  SET_RELEASE_LIST_SELECTED_TAB,
  SET_RELEASE_PROCESSING_ACTION,
} from '../state/actions';
import LoadingOverlay from 'app/common/LoadingOverlay';
import ReleaseActionJobDialog from './ReleaseScheduledActionDialog';
import { excludeEntityFromRelease } from '../common/utils';
import { createReleaseJob, fetchReleaseJobs, cancelReleaseJob } from '../releasesService';
import ReleaseWorkBenchContent from './ReleaseWorkBenchContent';
import ReleaseWorkBenchSideBar from './ReleaseWorkBenchSideBar';
import ValidateReleaseDialog from './ValidateReleaseDialog';
import { styles } from './styles';

const ReleaseDetailPage = ({ releaseId, defaultLocale, isMasterEnvironment }) => {
  const localStorage = getBrowserStorage('local');

  const [release, setRelease] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [entityRefreshKey, setEntityRefreshKey] = useState(null);
  const [entitiesLayout, setEntitiesLayout] = useState(localStorage.get('defaultView') || 'view');
  const [showScheduledActionsDialog, setShowScheduleActionDialog] = useState(false);
  const [showValidateReleaseDialog, setshowValidateReleaseDialog] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobs, setJobs] = useState([]);
  const {
    state: {
      selectedTab,
      processingAction,
      entities: { entries, assets },
    },
    dispatch,
  } = useContext(ReleasesContext);

  useEffect(() => {
    async function fetchRelease() {
      const fetchedRelease = await getReleaseById(releaseId);

      return fetchedRelease;
    }

    async function fetchEntriesAndAssets() {
      try {
        const fetchedRelease = await fetchRelease();
        setRelease(fetchedRelease);

        const [fetchedEntries, fetchedAssets] = await getEntities(fetchedRelease);

        dispatch({
          type: SET_RELEASE_ENTITIES,
          value: {
            entries: fetchedEntries,
            assets: fetchedAssets,
          },
        });
        dispatch({ type: SET_RELEASE_ENTITIES_LOADING, value: false });
      } catch {
        setHasError(true);
        dispatch({ type: SET_RELEASE_ENTITIES_LOADING, value: false });
      }
    }

    fetchEntriesAndAssets();
  }, [releaseId, entityRefreshKey, dispatch]);

  useEffect(() => {
    localStorage.set('defaultView', entitiesLayout);
    setEntitiesLayout(localStorage.get('defaultView'));
  }, [localStorage, entitiesLayout]);

  const handleEntityDelete = (entity) => {
    const releaseWithoutEntity = excludeEntityFromRelease(release, entity.sys.id);
    replaceReleaseById(releaseId, release.title, releaseWithoutEntity)
      .then(() => {
        setEntityRefreshKey(entity.sys.id);
        newForLocale(defaultLocale)
          .entityTitle(entity)
          .then((entityTitle) => {
            Notification.success(`${entityTitle || 'Untitled'} was removed from ${release.title}`);
          });
      })
      .catch(() => {
        Notification.error(`Failed deleting entity`);
      });
  };

  const displayValidation = (errors) => {
    dispatch({ type: SET_RELEASE_VALIDATIONS, value: errors });
    dispatch({
      type: SET_RELEASE_LIST_SELECTED_TAB,
      value: switchToErroredTab(errors, selectedTab),
    });
    Notification.error('Some entities did not pass validation');
  };

  const createJob = async ({ action, scheduledAt }) => {
    const releaseTitle = release.title;
    try {
      const job = await createReleaseJob({ releaseId, action, scheduledAt });
      return job;
    } catch (error) {
      Notification.error(`${releaseTitle} failed to schedule`);
      setShowScheduleActionDialog(false);
      setIsCreatingJob(false);
      logger.logError(`Release failed to schedule`, {
        error,
        message: error.message,
      });
    }
  };

  const handleScheduleCreate = async ({ scheduledAt, action }) => {
    setIsCreatingJob(true);
    const job = await createJob({ scheduledAt, action });
    if (job && job.sys) {
      Notification.success(`${release.title} was scheduled successfully`);
      setIsCreatingJob(false);
      setShowScheduleActionDialog(false);
      if (unpublishedEntities(entries) || unpublishedEntities(assets)) {
        setshowValidateReleaseDialog(true);
      }
      setJobs([job, ...jobs]);
    }
  };

  const handleScheduleCancel = async (jobId) => {
    try {
      await cancelReleaseJob(jobId);
      const job = jobs.find((j) => j.sys.id === jobId);
      setJobs(jobs.filter((j) => j !== job));
      Notification.success('Schedule canceled');
    } catch (error) {
      Notification.success('Failed to cancel schedule');
    }
  };

  const handleValidation = () => {
    dispatch({ type: SET_RELEASE_VALIDATIONS, value: [] });
    dispatch({ type: SET_RELEASE_PROCESSING_ACTION, value: 'Validating' });
    validateReleaseAction(releaseId)
      .then((validatedResponse) => {
        dispatch({ type: SET_RELEASE_PROCESSING_ACTION, value: null });
        const errored = validatedResponse.errored;
        if (errored.length) {
          return displayValidation(errored);
        }
        Notification.success('All entities passed validation');
      })
      .catch(() => {
        dispatch({ type: SET_RELEASE_PROCESSING_ACTION, value: null });
        Notification.error('Entities validation failed');
      });
  };

  const handlePublication = async () => {
    dispatch({ type: SET_RELEASE_PROCESSING_ACTION, value: 'Publishing' });
    dispatch({ type: SET_RELEASE_VALIDATIONS, value: [] });
    try {
      const publishResponse = await publishRelease(releaseId, release.sys.version);
      const releaseAction = await waitForReleaseAction(releaseId, publishResponse.sys.id);

      dispatch({ type: SET_RELEASE_PROCESSING_ACTION, value: null });
      Notification.success('Release was published successfully');
      setEntityRefreshKey(publishResponse.sys.id);
      return releaseAction;
    } catch (error) {
      dispatch({ type: SET_RELEASE_PROCESSING_ACTION, value: null });
      if (error.statusCode && error.statusCode === 422) {
        const errored = error.data.details.errors;
        if (errored.length) {
          return displayValidation(errored);
        }
      }
      Notification.error('Failed publishing Release');
    }
  };

  const activeLayout = (layout) => entitiesLayout === layout;

  const [{ isJobsLoading, error }, fetchJobs] = useAsyncFn(
    useCallback(async () => {
      const jobCollection = await fetchReleaseJobs(releaseId);
      setJobs(jobCollection);

      return jobCollection;
    }, [releaseId]),
    true
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const pendingJobs = jobs.filter((job) => job.sys.status === 'scheduled');

  return (
    <div>
      {processingAction && <LoadingOverlay message={`${processingAction} ${release.title}`} />}
      {hasError ? (
        <Note noteType="negative" className={styles.errorNote}>
          We are currently unable to display the details for this release due to a temporary system
          error.
        </Note>
      ) : (
        <Workbench>
          <Workbench.Header
            onBack={() => window.history.back()}
            title={release ? release.title : 'Untitled'}
            icon={<Icon icon="Release" size="large" color="positive" />}
          />
          <ReleaseWorkBenchContent
            activeLayout={activeLayout}
            release={release}
            entitiesLayout={entitiesLayout}
            setEntitiesLayout={setEntitiesLayout}
            handleEntityDelete={handleEntityDelete}
            defaultLocale={defaultLocale}
          />
          <ReleaseWorkBenchSideBar
            isJobsLoading={isJobsLoading}
            error={error}
            pendingJobs={pendingJobs}
            lastJob={jobs[0]}
            handlePublication={handlePublication}
            handleValidation={handleValidation}
            handleScheduleCancel={handleScheduleCancel}
            setShowScheduleActionDialog={setShowScheduleActionDialog}
            isMasterEnvironment={isMasterEnvironment}
          />
          <ValidateReleaseDialog
            onConfirm={() => {
              handleValidation();
              setshowValidateReleaseDialog(false);
            }}
            onCancel={() => setshowValidateReleaseDialog(false)}
            isShown={showValidateReleaseDialog}
          />
          {showScheduledActionsDialog ? (
            <ReleaseActionJobDialog
              onCancel={() => setShowScheduleActionDialog(false)}
              isSubmitting={isCreatingJob}
              pendingJobs={pendingJobs}
              onCreate={(newJob, timezone) => {
                handleScheduleCreate(newJob, timezone);
              }}
              isMasterEnvironment={isMasterEnvironment}
              linkType="release"
            />
          ) : null}
        </Workbench>
      )}
    </div>
  );
};

ReleaseDetailPage.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  releaseId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
};

const ReleaseDetailPageContainer = (props) => (
  <ReleasesProvider>
    <ReleaseDetailPage {...props} />
  </ReleasesProvider>
);

export default ReleaseDetailPageContainer;
