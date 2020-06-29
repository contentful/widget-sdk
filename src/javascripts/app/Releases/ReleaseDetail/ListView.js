import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tabs, Tab, TabPanel, Icon, Tooltip } from '@contentful/forma-36-react-components';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import ReleaseTable from './ReleaseTable';
import ReleasesEmptyStateMessage from '../ReleasesPage/ReleasesEmptyStateMessage';
import { displayedFields, pluralize, erroredEntityType } from './utils';
import { SET_RELEASE_LIST_SELECTED_TAB } from '../state/actions';

const styles = {
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
    paddingLeft: tokens.spacing2Xs,
    paddingRight: tokens.spacing2Xs,
  }),
  isVisible: css({
    display: 'block',
  }),
  tabTitle: css({
    marginLeft: tokens.spacing2Xs,
  }),
  validationTooltip: css({
    display: 'flex',
  }),
};

const ListView = ({ defaultLocale, handleEntityDelete }) => {
  const {
    state: {
      entities: { entries, assets },
      validations: validationErrors,
      loading: isLoading,
      selectedTab,
    },
    dispatch,
  } = useContext(ReleasesContext);

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
    <>
      <Tabs className={styles.tabs} withDivider>
        {Object.keys(tabs).map((key) => (
          <Tab
            id={key}
            key={key}
            testId={`test-id-${key}`}
            selected={selectedTab === key}
            className={styles.tab}
            onSelect={() => dispatch({ type: SET_RELEASE_LIST_SELECTED_TAB, value: key })}>
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
    </>
  );
};

ListView.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
};

export default ListView;
