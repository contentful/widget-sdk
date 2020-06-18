import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Tabs,
  Tab,
  TabPanel,
  Workbench,
  Icon,
  Note,
  Button,
  Notification,
  Tooltip,
} from '@contentful/forma-36-react-components';
import ReleaseTable from './ReleaseTable';
import {
  getReleaseById,
  replaceReleaseById,
  publishRelease,
  validateReleaseAction,
} from '../releasesService';
import ReleasesEmptyStateMessage from '../ReleasesPage/ReleasesEmptyStateMessage';
import {
  getEntities,
  displayedFields,
  waitForReleaseAction,
  pluralize,
  erroredEntityType,
  switchToErroredTab,
} from './utils';
import LoadingOverlay from 'app/common/LoadingOverlay';

const styles = {
  mainContent: css({
    padding: 0,
    '& > div': {
      height: '100%',
      minHeight: '100%',
      maxWidth: '100%',
      overflowY: 'hidden',
    },
  }),
  tabs: css({
    display: 'flex',
    paddingLeft: tokens.spacing3Xl,
  }),
  tab: css({
    alignItems: 'center',
    display: 'flex',
    textAlign: 'center',
  }),
  tabPanel: css({
    display: 'none',
    height: '100%',
    paddingTop: tokens.spacingM,
    overflowY: 'auto',
  }),
  isVisible: css({
    display: 'block',
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    width: '360px',
    padding: tokens.spacingM,
  }),
  tabTitle: css({
    marginLeft: tokens.spacing2Xs,
  }),
  tag: css({
    display: 'flex',
    justifyContent: 'space-between',
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
  validationTooltip: css({
    display: 'flex',
  }),
};

const ReleaseDetailPage = ({ releaseId, defaultLocale }) => {
  const [selectedTab, setSelectedTab] = useState('entries');
  const [entries, setEntries] = useState([]);
  const [assets, setAssets] = useState([]);
  const [release, setRelease] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [entityRefreshKey, setEntityRefreshKey] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

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
        setEntries(fetchedEntries);
        setAssets(fetchedAssets);
        setIsLoading(false);
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    }

    fetchEntriesAndAssets();
  }, [releaseId, entityRefreshKey]);

  const handleEntityDelete = (entity) => {
    const releaseWithoutEntity = release.entities.items.filter(
      ({ sys: { id } }) => id !== entity.sys.id
    );

    replaceReleaseById(releaseId, release.title, releaseWithoutEntity)
      .then(() => {
        setEntityRefreshKey(entity.sys.id);
        Notification.success('Entity was sucessfully deleted');
      })
      .catch(() => {
        Notification.error(`Failed deleting entity`);
      });
  };

  const handleReleaseAction = (validatedResponse, action) => {
    if (validatedResponse.errored.length) {
      setProcessingAction(null);
      setValidationErrors(validatedResponse.errored);
      setSelectedTab(switchToErroredTab(validatedResponse.errored, selectedTab));
      Notification.error('Some entities did not pass validation');
    } else {
      setProcessingAction(null);
      action.onSuccess();
    }
  };

  const validate = (action = null) => {
    setProcessingAction('Validating');
    return validateReleaseAction(releaseId, action);
  };

  const publish = async () => {
    setProcessingAction('Publishing');
    try {
      const publishResponse = await publishRelease(releaseId, release.sys.version);
      const releaseAction = await waitForReleaseAction(releaseId, publishResponse.sys.id);

      setProcessingAction(null);
      Notification.success('Release was published successfully');
      setEntityRefreshKey(publishResponse.sys.id);
      return releaseAction;
    } catch {
      setProcessingAction(null);
      Notification.error('Failed publishing Release');
    }
  };

  const handlePublication = () => {
    validate('publish').then((response) => {
      handleReleaseAction(response, { onSuccess: publish });
    });
  };

  const handleValidation = () => {
    const displaySuccessNotification = () => Notification.success('All entities passed validation');
    validate().then((response) => {
      handleReleaseAction(response, { onSuccess: displaySuccessNotification });
    });
  };

  const renderTabIcon = (entityType) => {
    const erroredEntityTypeLength = erroredEntityType(entityType, validationErrors).length;
    if (erroredEntityTypeLength) {
      const toolTipText = `${erroredEntityTypeLength} ${pluralize(
        erroredEntityTypeLength,
        `${entityType.toLowerCase()} has`
      )} validation errors`;
      return (
        <Tooltip
          content={toolTipText}
          targetWrapperClassName={styles.validationTooltip}
          place="top">
          <Icon icon="ErrorCircle" color="negative" />
        </Tooltip>
      );
    }
    return <Icon icon={entityType} size="small" color="primary" />;
  };

  const tabs = {
    entries: {
      title: (
        <div className={styles.tab}>
          {renderTabIcon('Entry')}
          <div className={styles.tabTitle}>Entries {entries.length ? entries.length : 0}</div>
        </div>
      ),
      render: () =>
        !isLoading && !entries.length ? (
          <ReleasesEmptyStateMessage testId="entries" title="No entries in this release" />
        ) : (
          <ReleaseTable
            displayedFields={displayedFields.entries}
            entities={entries}
            isLoading={isLoading}
            defaultLocale={defaultLocale}
            handleEntityDelete={handleEntityDelete}
            validationErrors={validationErrors}
          />
        ),
    },
    assets: {
      title: (
        <div className={styles.tab}>
          {renderTabIcon('Asset')}
          <div className={styles.tabTitle}>Assets {assets.length ? assets.length : 0}</div>
        </div>
      ),
      render: () =>
        !isLoading && !assets.length ? (
          <ReleasesEmptyStateMessage testId="assets" title="No assets in this release" />
        ) : (
          <ReleaseTable
            displayedFields={displayedFields.assets}
            entities={assets}
            isLoading={isLoading}
            defaultLocale={defaultLocale}
            handleEntityDelete={handleEntityDelete}
            validationErrors={validationErrors}
          />
        ),
    },
  };

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
          <Workbench.Content className={styles.mainContent}>
            <Tabs className={styles.tabs} withDivider>
              {Object.keys(tabs).map((key) => (
                <Tab
                  id={key}
                  key={key}
                  testId={`test-id-${key}`}
                  selected={selectedTab === key}
                  className={styles.tab}
                  onSelect={() => setSelectedTab(key)}>
                  {tabs[key].title}
                </Tab>
              ))}
            </Tabs>
            {Object.keys(tabs).map((key) => (
              <TabPanel
                id={key}
                key={key}
                className={cx(styles.tabPanel, {
                  [styles.isVisible]: selectedTab === key,
                })}>
                {tabs[key].render()}
              </TabPanel>
            ))}
          </Workbench.Content>
          <Workbench.Sidebar
            className={styles.sidebar}
            position="right"
            testId="cf-ui-workbench-sidebar">
            <div className={styles.buttons}>
              <Button
                buttonType="positive"
                className=""
                isFullWidth
                disabled={!entries.length && !assets.length}
                onClick={handlePublication}>
                Publish now
              </Button>
              <Button
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

export default ReleaseDetailPage;
