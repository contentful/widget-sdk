import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Workbench,
  Icon,
  Note,
  Button,
  Notification,
  Subheading,
} from '@contentful/forma-36-react-components';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import FilterPill from 'app/ContentList/Search/FilterPill';
import ValueInput from 'app/ContentList/Search/FilterValueInputs';
import { ReleasesProvider, ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import ReleasesEmptyStateMessage from '../ReleasesPage/ReleasesEmptyStateMessage';
import {
  getReleaseById,
  replaceReleaseById,
  publishRelease,
  validateReleaseAction,
} from '../releasesService';
import { newForLocale } from 'app/entity_editor/entityHelpers';
import {
  getEntities,
  waitForReleaseAction,
  switchToErroredTab,
  VIEW_LABELS,
  pluralize,
} from './utils';
import {
  SET_RELEASE_ENTITIES,
  SET_RELEASE_ENTITIES_LOADING,
  SET_RELEASE_VALIDATIONS,
  SET_RELEASE_LIST_SELECTED_TAB,
  SET_RELEASE_PROCESSING_ACTION,
} from '../state/actions';
import LoadingOverlay from 'app/common/LoadingOverlay';
import ListView from './ListView';
import CardView from './CardView';
import { excludeEntityFromRelease } from '../common/utils';

const styles = {
  mainContent: css({
    padding: 0,
    '& > div': {
      height: '100%',
      minHeight: '100%',
      maxWidth: '100%',
    },
  }),
  mainContentListView: css({
    '& > div': {
      overflowY: 'hidden',
    },
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    width: '360px',
    padding: tokens.spacingM,
  }),
  buttons: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  errorNote: css({
    display: 'flex',
    justifyContent: 'center',
    width: '50%',
    margin: 'auto',
    marginTop: tokens.spacing4Xl,
  }),
  layoutPillsWrapper: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '70%',
    margin: 'auto',
    marginTop: tokens.spacingXl,
    marginBottom: tokens.spacingM,
  }),
  layoutPills: css({
    pointerEvents: 'none',
    ':focus, :hover': {
      boxShadow: 'none',
    },
    '& select': css({
      width: 'auto !important',
      textAlign: 'center',
      pointerEvents: 'all',
    }),
  }),
  layoutList: css({
    width: '91%',
  }),
  activePill: css({
    backgroundColor: tokens.colorElementDark,
  }),
  header: css({
    display: 'flex',
    alignItems: 'baseline',
    '& h2': css({
      marginRight: tokens.spacingXs,
    }),
  }),
  hideDisplay: css({
    display: 'none',
  }),
};

const ReleaseDetailPage = ({ releaseId, defaultLocale }) => {
  const localStorage = getBrowserStorage('local');

  const [release, setRelease] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [entityRefreshKey, setEntityRefreshKey] = useState(null);
  const [entitiesLayout, setEntitiesLayout] = useState(localStorage.get('defaultView') || 'view');
  const {
    state: {
      entities: { entries, assets },
      selectedTab,
      processingAction,
      loading: isLoading,
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
          <Workbench.Content
            className={cx(styles.mainContent, {
              [styles.mainContentListView]: activeLayout('list'),
            })}>
            {!isLoading && !release.entities.items.length ? (
              <ReleasesEmptyStateMessage testId="detail" title="No entities in this release" />
            ) : (
              <>
                <div
                  className={cx(styles.layoutPillsWrapper, {
                    [styles.layoutList]: activeLayout('list'),
                  })}>
                  <div className={styles.header}>
                    <Subheading element="h2">Content</Subheading>
                    <span className={cx({ [styles.hideDisplay]: activeLayout('list') })}>
                      {entries.length} {pluralize(entries.length, 'entry')} and {assets.length}{' '}
                      {pluralize(assets.length, 'asset')}
                    </span>
                  </div>
                  <FilterPill
                    className={styles.layoutPills}
                    filter={{
                      label: 'View',
                      valueInput: ValueInput.Select(
                        Object.keys(VIEW_LABELS).map((key) => [key, VIEW_LABELS[key]])
                      ),
                    }}
                    value={entitiesLayout}
                    onChange={setEntitiesLayout}
                  />
                </div>

                {activeLayout('list') ? (
                  <ListView defaultLocale={defaultLocale} handleEntityDelete={handleEntityDelete} />
                ) : (
                  <CardView handleEntityDelete={handleEntityDelete} defaultLocale={defaultLocale} />
                )}
              </>
            )}
          </Workbench.Content>
          <Workbench.Sidebar
            className={styles.sidebar}
            position="right"
            testId="cf-ui-workbench-sidebar">
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
            </div>
          </Workbench.Sidebar>
        </Workbench>
      )}
    </div>
  );
};

ReleaseDetailPage.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  releaseId: PropTypes.string.isRequired,
};

const ReleaseDetailPageContainer = (props) => (
  <ReleasesProvider>
    <ReleaseDetailPage {...props} />
  </ReleasesProvider>
);

export default ReleaseDetailPageContainer;
