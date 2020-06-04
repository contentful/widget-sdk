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
  Card,
  Tag,
  Note,
  IconButton,
  Notification,
} from '@contentful/forma-36-react-components';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import ReleaseTable from './ReleaseTable';
import { getReleaseById, deleteEntityFromReleaseById } from '../releasesService';
import ReleasesEmptyStateMessage from '../ReleasesPage/ReleasesEmptyStateMessage';
import { getEntities, displayedFields } from './utils';

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
  cardIntro: css({
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
};

const ReleaseDetailPage = ({ releaseId, defaultLocale }) => {
  const [selectedTab, setSelectedTab] = useState('entries');
  const [entries, setEntries] = useState([]);
  const [assets, setAssets] = useState([]);
  const [release, setRelease] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [entityDeleteKey, setEntityDeleteKey] = useState(null);

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
  }, [releaseId, entityDeleteKey]);

  const handleEntityDelete = (entity) => {
    const releaseWithoutEntity = release.entities.items.filter(
      ({ sys: { id } }) => id !== entity.sys.id
    );

    deleteEntityFromReleaseById(releaseId, release.title, releaseWithoutEntity)
      .then(() => {
        setEntityDeleteKey(entity.sys.id);
        Notification.success('Entity was sucessfully deleted');
      })
      .catch(() => {
        Notification.error(`Failed deleting entity`);
      });
  };

  const tabs = {
    entries: {
      title: (
        <div className={styles.tab}>
          <Icon icon="Entry" size="small" color="primary" />
          <div className={styles.tabTitle}>Entries {entries.length ? entries.length : 0}</div>
        </div>
      ),
      render: () =>
        !isLoading && !entries.length ? (
          <ReleasesEmptyStateMessage title="No entries in this release" />
        ) : (
          <ReleaseTable
            displayedFields={displayedFields.entries}
            entities={entries}
            isLoading={isLoading}
            defaultLocale={defaultLocale}
            handleEntityDelete={handleEntityDelete}
          />
        ),
    },
    assets: {
      title: (
        <div className={styles.tab}>
          <Icon icon="Asset" size="small" color="primary" />
          <div className={styles.tabTitle}>Assets {assets.length ? assets.length : 0}</div>
        </div>
      ),
      render: () =>
        !isLoading && !assets.length ? (
          <ReleasesEmptyStateMessage title="No assets in this release" />
        ) : (
          <ReleaseTable
            displayedFields={displayedFields.assets}
            entities={assets}
            isLoading={isLoading}
            defaultLocale={defaultLocale}
            handleEntityDelete={handleEntityDelete}
          />
        ),
    },
  };

  return (
    <div>
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
            {/* Placeholder. To be changed when there are actual statuses to the release */}
            <div className={styles.cardIntro}>The release was created at</div>
            <Card padding="large">
              <Tag className={styles.tag} testId="release-item" tagType="positive">
                Created
                <IconButton
                  iconProps={{
                    icon: 'MoreHorizontal',
                  }}
                  buttonType="muted"
                  label="Remove team"
                  testId="release-action"
                />
              </Tag>
              {release && (
                <div>
                  <RelativeDateTime value={release.sys.createdAt} />
                </div>
              )}
            </Card>
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
